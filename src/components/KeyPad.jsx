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
    <div className="grid grid-cols-3 md:gap-5 gap-6 max-w-xs mx-auto">
      {keyboard.map(({ num, text }) => (
        <button
          key={num}
          type="button"
          className="flex flex-col items-center justify-center w-20 h-20 sm:w-14 sm:h-14 md:w-12 md:h-12 rounded-full bg-muted/80 hover:bg-muted active:bg-muted/60 focus:outline-none focus:ring-2 ring-primary/50 transition-all touch-manipulation"
          onClick={() => setPhoneNumber((prev) => prev + String(num))}
          onTouchStart={(e) => {
            // Prevent mobile keyboard from appearing
            e.preventDefault();
            e.target.focus();
          }}
          onFocus={(e) => {
            // Prevent mobile keyboard on focus
            e.target.blur();
          }}
        >
          <span className="text-3xl sm:text-xl md:text-lg font-normal text-foreground select-none">{num}</span>
          {text && <span className="text-xs sm:text-[9px] text-muted-foreground uppercase select-none tracking-wider">{text}</span>}
        </button>
      ))}
    </div>
  </div>
);

export default KeyPad;
