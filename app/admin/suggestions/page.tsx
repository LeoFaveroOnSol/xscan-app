import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { formatTimeAgo } from '@/lib/utils/formatters';
import { CheckCircle, XCircle, Clock, MessageSquare, User, Calendar } from 'lucide-react';
import SuggestionActions from '@/components/admin/SuggestionActions';

interface ChannelSuggestion {
  id: string;
  channel_username: string;
  display_name: string | null;
  description: string | null;
  suggested_by_telegram_id: string | null;
  suggested_by_username: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  approved_channel_id: string | null;
  created_at: string;
}

async function getSuggestions() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('channel_suggestions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching suggestions:', error);
    return [];
  }

  return data || [];
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

export default async function AdminSuggestionsPage() {
  const suggestions = await getSuggestions();

  const pendingCount = suggestions.filter((s: ChannelSuggestion) => s.status === 'pending').length;
  const approvedCount = suggestions.filter((s: ChannelSuggestion) => s.status === 'approved').length;
  const rejectedCount = suggestions.filter((s: ChannelSuggestion) => s.status === 'rejected').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-blue-500" />
            Channel Suggestions
          </h1>
          <p className="text-muted-foreground">
            Review Telegram channel suggestions from bot users
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 rounded-lg bg-red-500/10 text-red-500">
              <XCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggestions List */}
      <div className="space-y-4">
        {suggestions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No channel suggestions yet. Users can suggest channels via the Telegram bot.
            </CardContent>
          </Card>
        ) : (
          suggestions.map((suggestion: ChannelSuggestion) => (
            <Card key={suggestion.id} className={
              suggestion.status === 'pending'
                ? 'border-yellow-500/30 bg-yellow-500/5'
                : suggestion.status === 'approved'
                ? 'border-green-500/20'
                : 'border-red-500/20 opacity-60'
            }>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Channel Info */}
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <TelegramIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <a
                          href={`https://t.me/${suggestion.channel_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-lg hover:text-blue-400 transition-colors"
                        >
                          @{suggestion.channel_username}
                        </a>
                        {suggestion.status === 'pending' && (
                          <Badge variant="warning" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                        {suggestion.status === 'approved' && (
                          <Badge variant="success" size="sm">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </Badge>
                        )}
                        {suggestion.status === 'rejected' && (
                          <Badge variant="danger" size="sm">
                            <XCircle className="w-3 h-3 mr-1" />
                            Rejected
                          </Badge>
                        )}
                      </div>

                      {suggestion.display_name && suggestion.display_name !== suggestion.channel_username && (
                        <p className="text-sm text-muted-foreground mb-1">
                          {suggestion.display_name}
                        </p>
                      )}

                      {suggestion.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {suggestion.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {suggestion.suggested_by_username && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            @{suggestion.suggested_by_username}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimeAgo(suggestion.created_at)}
                        </span>
                      </div>

                      {suggestion.rejection_reason && (
                        <p className="text-sm text-red-400 mt-2">
                          Rejection reason: {suggestion.rejection_reason}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {suggestion.status === 'pending' && (
                    <SuggestionActions suggestionId={suggestion.id} channelUsername={suggestion.channel_username} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
