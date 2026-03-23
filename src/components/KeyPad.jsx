import { CornerDownLeft } from 'lucide-react';

const keyboard = [
  { num: 1, text: '' },
  { num: 2, text: 'abc' },
  { num: 3, text: 'def' },
  { num: 4, text: 'ghi' },
  { num: 5, text: 'jkl' },
  { num: 6, text: 'mno' },
  { num: 7, text: 'pqrs' },
  { num: 8, text: 'tuv' },
  { num: 9, text: 'wxyz' },
  { num: '*', text: '' },
  { num: 0, text: '+' },
  { num: '#', text: '' },
];

const KeyPad = ({ setPhoneNumber }) => (
  <div className="mt-0.5 flex items-center justify-center">
    <div className="mx-auto grid max-w-[232px] grid-cols-3 gap-3 md:gap-3">
      {keyboard.map(({ num, text }) => (
        <button
          key={num}
          type="button"
          className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-muted/80 transition-all touch-manipulation hover:bg-muted active:bg-muted/60 focus:outline-none focus:ring-2 ring-primary/50"
          onClick={() => setPhoneNumber((prev) => prev + String(num))}
        >
          <span className="select-none text-2xl font-normal text-foreground">{num}</span>
          {text && <span className="select-none text-[9px] uppercase tracking-wider text-muted-foreground">{text}</span>}
        </button>
      ))}
    </div>
  </div>
);

export default KeyPad;
