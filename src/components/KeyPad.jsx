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
  <div className="flex justify-center items-center mt-2">
    <div className="grid grid-cols-3 gap-3">
      {keyboard.map(({ num, text }) => (
        <button
          key={num}
          type="button"
          className="flex flex-col items-center justify-center w-12 h-12 rounded-full bg-card/80 border border-border shadow-sm hover:bg-accent/60 focus:outline-none focus:ring-2 ring-accent transition-all"
          onClick={() => setPhoneNumber((prev) => prev + String(num))}
        >
          <span className="text-lg font-semibold text-foreground select-none">{num}</span>
          {text && <span className="text-xs text-muted-foreground uppercase select-none">{text}</span>}
        </button>
      ))}
    </div>
  </div>
);

export default KeyPad;
