import { ReactNode } from 'react';

interface Props {
  legend: ReactNode;
  children: ReactNode;
}

export default function WithLegend({ legend, children }: Props) {
  return (
    <div className="flex gap-5">
      <div className="w-56 flex-shrink-0 hidden lg:block">
        <div className="sticky top-6">
          {legend}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
