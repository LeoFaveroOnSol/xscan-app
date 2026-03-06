import { cn } from '@/lib/utils/cn';
import { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from 'react';

const Table = forwardRef<HTMLTableElement, HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="w-full overflow-auto">
        <table ref={ref} className={cn('w-full caption-bottom text-sm', className)} {...props} />
      </div>
    );
  }
);
Table.displayName = 'Table';

const TableHeader = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />;
  }
);
TableHeader.displayName = 'TableHeader';

const TableBody = forwardRef<HTMLTableSectionElement, HTMLAttributes<HTMLTableSectionElement>>(
  ({ className, ...props }, ref) => {
    return <tbody ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
  }
);
TableBody.displayName = 'TableBody';

const TableRow = forwardRef<HTMLTableRowElement, HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => {
    return (
      <tr
        ref={ref}
        className={cn('border-b border-border transition-colors table-row-hover', className)}
        {...props}
      />
    );
  }
);
TableRow.displayName = 'TableRow';

interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  sortable?: boolean;
  sorted?: 'asc' | 'desc' | null;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
  ({ className, sortable, sorted, children, ...props }, ref) => {
    return (
      <th
        ref={ref}
        className={cn(
          'h-12 px-4 text-left align-middle font-semibold text-muted-foreground',
          sortable && 'cursor-pointer hover:text-foreground select-none',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-1">
          {children}
          {sortable && sorted && (
            <span className="text-primary">{sorted === 'asc' ? '↑' : '↓'}</span>
          )}
        </div>
      </th>
    );
  }
);
TableHead.displayName = 'TableHead';

const TableCell = forwardRef<HTMLTableCellElement, TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => {
    return (
      <td ref={ref} className={cn('px-4 py-3 align-middle', className)} {...props} />
    );
  }
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
