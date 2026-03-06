'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Check, AlertCircle, ArrowRight, Wallet, ChevronDown, Eye, EyeOff, Link2, Unlink, User, MessageSquare } from 'lucide-react';
import bs58 from 'bs58';

type ApplicationType = 'kol' | 'telegram';

interface FormData {
  // Common fields
  display_name: string;
  additional_info: string;
  website_url: string;
  // KOL specific
  twitter_handle: string;
  telegram_handle: string;
  manual_wallet: string;
  hide_wallet: boolean;
  // Telegram channel specific
  channel_username: string;
}

interface FormErrors {
  twitter_handle?: string;
  display_name?: string;
  additional_info?: string;
  manual_wallet?: string;
  channel_username?: string;
}

type WalletMode = 'none' | 'connect' | 'manual';

export default function ApplicationForm() {
  const { publicKey, signMessage, connected, connecting, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedInfo, setSubmittedInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [applicationType, setApplicationType] = useState<ApplicationType>('kol');
  const [walletMode, setWalletMode] = useState<WalletMode>('none');

  const [formData, setFormData] = useState<FormData>({
    display_name: '',
    additional_info: '',
    website_url: '',
    twitter_handle: '',
    telegram_handle: '',
    manual_wallet: '',
    hide_wallet: false,
    channel_username: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showOptional, setShowOptional] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (applicationType === 'kol') {
      if (!formData.twitter_handle.trim()) {
        newErrors.twitter_handle = 'Twitter handle is required';
      } else if (!/^@?[a-zA-Z0-9_]{1,15}$/.test(formData.twitter_handle.replace('@', ''))) {
        newErrors.twitter_handle = 'Invalid Twitter handle format';
      }

      if (!formData.display_name.trim()) {
        newErrors.display_name = 'Name is required';
      }

      if (!formData.additional_info.trim()) {
        newErrors.additional_info = 'Please tell us about yourself';
      }

      // Validate manual wallet if provided
      if (walletMode === 'manual' && formData.manual_wallet.trim()) {
        const wallet = formData.manual_wallet.trim();
        if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet)) {
          newErrors.manual_wallet = 'Invalid Solana wallet address';
        }
      }
    } else {
      // Telegram channel validation
      if (!formData.channel_username.trim()) {
        newErrors.channel_username = 'Channel username is required';
      } else if (!/^@?[a-zA-Z0-9_]{5,32}$/.test(formData.channel_username.replace('@', ''))) {
        newErrors.channel_username = 'Invalid Telegram channel username';
      }

      if (!formData.display_name.trim()) {
        newErrors.display_name = 'Channel name is required';
      }

      if (!formData.additional_info.trim()) {
        newErrors.additional_info = 'Please tell us about your channel';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const newValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const getWalletAddress = (): string | null => {
    if (walletMode === 'connect' && connected && publicKey) {
      return publicKey.toBase58();
    }
    if (walletMode === 'manual' && formData.manual_wallet.trim()) {
      return formData.manual_wallet.trim();
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (applicationType === 'kol') {
        // KOL Application
        const walletAddress = getWalletAddress();
        let signature = '';
        let message = '';

        if (walletMode === 'connect' && connected && publicKey && signMessage) {
          message = `XSCAN KOL Application\n\nTwitter: ${formData.twitter_handle}\nWallet: ${publicKey.toBase58()}\nTimestamp: ${Date.now()}`;
          const messageBytes = new TextEncoder().encode(message);
          const signatureBytes = await signMessage(messageBytes);
          signature = bs58.encode(signatureBytes);
        }

        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_type: 'kol',
            twitter_handle: formData.twitter_handle,
            wallet_address: walletAddress,
            display_name: formData.display_name,
            additional_info: formData.additional_info,
            website_url: formData.website_url || null,
            telegram_handle: formData.telegram_handle || null,
            wallet_signature: signature || null,
            message: message || null,
            hide_wallet: formData.hide_wallet,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit application');
        }

        setSubmittedInfo(walletAddress || formData.twitter_handle);
      } else {
        // Telegram Channel Application
        const response = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            application_type: 'telegram_channel',
            channel_username: formData.channel_username.replace('@', ''),
            display_name: formData.display_name,
            additional_info: formData.additional_info,
            website_url: formData.website_url || null,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit application');
        }

        setSubmittedInfo(`@${formData.channel_username.replace('@', '')}`);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Application error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWalletModeChange = (mode: WalletMode) => {
    setWalletMode(mode);
    if (mode === 'connect' && !connected) {
      setVisible(true);
    }
    if (mode !== 'connect' && connected) {
      disconnect();
    }
    if (mode !== 'manual') {
      setFormData(prev => ({ ...prev, manual_wallet: '' }));
    }
  };

  // Update wallet mode when wallet connects
  if (connected && walletMode === 'none') {
    setWalletMode('connect');
  }

  if (submitted) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-[#111113]">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-[60px]" />

        <div className="relative text-center py-16 px-6">
          <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-5 animate-scale-in">
            <Check className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Application Submitted</h2>
          <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
            We&apos;ll review your {applicationType === 'kol' ? 'KOL' : 'channel'} application and get back to you soon.
          </p>
          {submittedInfo && (
            <p className="text-xs text-muted-foreground font-mono bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2 inline-block">
              {submittedInfo.length > 20 ? `${submittedInfo.slice(0, 8)}...${submittedInfo.slice(-8)}` : submittedInfo}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#111113] transition-all duration-300 hover:border-white/[0.1]">
      {/* Card glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="relative p-6 md:p-8">
        {/* Application Type Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">What are you applying for?</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setApplicationType('kol')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                applicationType === 'kol'
                  ? 'border-primary/50 bg-primary/10 text-primary shadow-[0_0_15px_rgba(0,255,136,0.1)]'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1] hover:text-white'
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-sm font-medium">KOL / Trader</span>
              <span className="text-xs opacity-60">Personal account</span>
            </button>
            <button
              type="button"
              onClick={() => setApplicationType('telegram')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                applicationType === 'telegram'
                  ? 'border-blue-500/50 bg-blue-500/10 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                  : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1] hover:text-white'
              }`}
            >
              <MessageSquare className="w-6 h-6" />
              <span className="text-sm font-medium">Telegram Channel</span>
              <span className="text-xs opacity-60">Calls channel</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {applicationType === 'kol' ? (
            <>
              {/* KOL Form Fields */}
              {/* Twitter Handle */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Twitter Handle <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="twitter_handle"
                  placeholder="@username"
                  value={formData.twitter_handle}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 ${
                    errors.twitter_handle
                      ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-white/[0.06] focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,136,0.05)]'
                  }`}
                />
                {errors.twitter_handle && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.twitter_handle}</p>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="display_name"
                  placeholder="Your display name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 ${
                    errors.display_name
                      ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-white/[0.06] focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,136,0.05)]'
                  }`}
                />
                {errors.display_name && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.display_name}</p>
                )}
              </div>

              {/* Additional Information */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Information <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="additional_info"
                  placeholder="Tell us about yourself, your experience with crypto calls, and why you want to join XSCAN..."
                  rows={4}
                  value={formData.additional_info}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 resize-none ${
                    errors.additional_info
                      ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-white/[0.06] focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,136,0.05)]'
                  }`}
                />
                {errors.additional_info && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.additional_info}</p>
                )}
              </div>

              {/* Wallet Section */}
              <div className="pt-2">
                <label className="block text-sm font-medium mb-3">
                  Wallet Address <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </label>

                {/* Wallet Mode Selector */}
                <div className="flex gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => handleWalletModeChange('none')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                      walletMode === 'none'
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1]'
                    }`}
                  >
                    <Unlink className="w-3.5 h-3.5" />
                    No Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWalletModeChange('connect')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                      walletMode === 'connect'
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1]'
                    }`}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    Connect
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWalletModeChange('manual')}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-medium rounded-lg border transition-all ${
                      walletMode === 'manual'
                        ? 'border-primary/50 bg-primary/10 text-primary'
                        : 'border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/[0.1]'
                    }`}
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    Type
                  </button>
                </div>

                {/* Connected Wallet Display */}
                {walletMode === 'connect' && (
                  <div className="space-y-3">
                    {connected && publicKey ? (
                      <div className="flex items-center justify-between gap-2 text-xs bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <span className="font-mono text-muted-foreground">
                            {publicKey.toBase58().slice(0, 8)}...{publicKey.toBase58().slice(-8)}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => disconnect()}
                          className="text-red-400 hover:text-red-300 text-xs"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setVisible(true)}
                        disabled={connecting}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-primary/30 transition-all"
                      >
                        <Wallet className="w-4 h-4" />
                        {connecting ? 'Connecting...' : 'Connect Wallet'}
                      </button>
                    )}
                  </div>
                )}

                {/* Manual Wallet Input */}
                {walletMode === 'manual' && (
                  <div>
                    <input
                      type="text"
                      name="manual_wallet"
                      placeholder="Enter your Solana wallet address"
                      value={formData.manual_wallet}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 font-mono ${
                        errors.manual_wallet
                          ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                          : 'border-white/[0.06] focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,136,0.05)]'
                      }`}
                    />
                    {errors.manual_wallet && (
                      <p className="text-xs text-red-400 mt-1.5">{errors.manual_wallet}</p>
                    )}
                  </div>
                )}

                {/* Hide Wallet Option */}
                {(walletMode === 'connect' && connected) || (walletMode === 'manual' && formData.manual_wallet.trim()) ? (
                  <label className="flex items-center gap-3 mt-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        name="hide_wallet"
                        checked={formData.hide_wallet}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 rounded border border-white/[0.1] bg-white/[0.02] peer-checked:bg-primary peer-checked:border-primary transition-all flex items-center justify-center">
                        {formData.hide_wallet && <Check className="w-3 h-3 text-black" />}
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground group-hover:text-white transition-colors flex items-center gap-2">
                      {formData.hide_wallet ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      Hide wallet address on profile
                    </span>
                  </label>
                ) : null}
              </div>

              {/* Optional Fields Section */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowOptional(!showOptional)}
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-white uppercase tracking-wider transition-colors duration-200 group"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showOptional ? 'rotate-180' : ''}`} />
                  <span>Optional</span>
                </button>

                <div className={`grid transition-all duration-300 ease-in-out ${showOptional ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Website</label>
                        <input
                          type="url"
                          name="website_url"
                          placeholder="https://yoursite.com"
                          value={formData.website_url}
                          onChange={handleChange}
                          className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,136,0.05)] transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Telegram</label>
                        <input
                          type="text"
                          name="telegram_handle"
                          placeholder="@telegram_username"
                          value={formData.telegram_handle}
                          onChange={handleChange}
                          className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] outline-none focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(0,255,136,0.05)] transition-all duration-200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Telegram Channel Form Fields */}
              {/* Channel Username */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="channel_username"
                  placeholder="@your_channel"
                  value={formData.channel_username}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 ${
                    errors.channel_username
                      ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-white/[0.06] focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.05)]'
                  }`}
                />
                {errors.channel_username && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.channel_username}</p>
                )}
              </div>

              {/* Channel Name */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Channel Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="display_name"
                  placeholder="Your channel's display name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 ${
                    errors.display_name
                      ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-white/[0.06] focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.05)]'
                  }`}
                />
                {errors.display_name && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.display_name}</p>
                )}
              </div>

              {/* Channel Description */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  About Your Channel <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="additional_info"
                  placeholder="Tell us about your channel - what kind of calls do you share, your track record, target audience..."
                  rows={4}
                  value={formData.additional_info}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border outline-none transition-all duration-200 resize-none ${
                    errors.additional_info
                      ? 'border-red-500/50 focus:border-red-500 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                      : 'border-white/[0.06] focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.05)]'
                  }`}
                />
                {errors.additional_info && (
                  <p className="text-xs text-red-400 mt-1.5">{errors.additional_info}</p>
                )}
              </div>

              {/* Optional Website */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Website <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </label>
                <input
                  type="url"
                  name="website_url"
                  placeholder="https://yoursite.com"
                  value={formData.website_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 text-sm rounded-xl bg-white/[0.03] border border-white/[0.06] outline-none focus:border-blue-500/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.05)] transition-all duration-200"
                />
              </div>
            </>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold rounded-xl text-black disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 ${
              applicationType === 'kol'
                ? 'bg-primary hover:bg-primary/90 hover:shadow-[0_0_25px_rgba(0,255,136,0.3)]'
                : 'bg-blue-500 hover:bg-blue-500/90 hover:shadow-[0_0_25px_rgba(59,130,246,0.3)]'
            }`}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                Submit Application
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-xs text-center text-muted-foreground">
            {applicationType === 'kol' && walletMode === 'connect' && connected
              ? "You'll sign a message to verify wallet ownership"
              : applicationType === 'telegram'
              ? "We'll review your channel and add it to our tracking"
              : 'No wallet verification required'}
          </p>
        </form>
      </div>
    </div>
  );
}
