import { useRef, useEffect } from 'react';
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

const KeyPad = ({ setPhoneNumber }) => {
  const inputRef = useRef(null);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setPhoneNumber(value);
  };

  const handleKeypadClick = () => {
    // Focus the hidden input to trigger mobile keyboard
    if (inputRef.current && window.innerWidth < 768) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex justify-center items-center mt-2">
      {/* Hidden input for mobile numeric keyboard */}
      <input
        ref={inputRef}
        type="tel"
        inputMode="numeric"
        pattern="[0-9*#+-]*"
        className="absolute opacity-0 pointer-events-none"
        onChange={handleInputChange}
        aria-hidden="true"
      />
      
      <div className="grid grid-cols-3 md:gap-5 gap-6 max-w-xs mx-auto">
        {keyboard.map(({ num, text }) => (
          <button
            key={num}
            type="button"
            className="flex flex-col items-center justify-center w-20 h-20 sm:w-14 sm:h-14 md:w-12 md:h-12 rounded-full bg-muted/80 hover:bg-muted active:bg-muted/60 focus:outline-none focus:ring-2 ring-primary/50 transition-all touch-manipulation"
            onClick={() => {
              setPhoneNumber((prev) => prev + String(num));
              handleKeypadClick();
            }}
          >
            <span className="text-3xl sm:text-xl md:text-lg font-normal text-foreground select-none">{num}</span>
            {text && <span className="text-xs sm:text-[9px] text-muted-foreground uppercase select-none tracking-wider">{text}</span>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeyPad;
