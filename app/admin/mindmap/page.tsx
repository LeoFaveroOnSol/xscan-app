'use client';

export default function MindmapPage() {
  return (
    <div className="h-[calc(100vh-4rem)] w-full -m-8">
      <iframe
        src="/mindmap.html"
        className="w-full h-full border-0"
        title="XSCAN Mind Map"
      />
    </div>
  );
}
