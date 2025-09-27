import { CheckSquare } from 'lucide-react';

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <CheckSquare className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold font-headline text-primary">SmartTasker</span>
    </div>
  );
}
