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
  <div className="flex justify-center items-center mt-3">
    <div className="grid grid-cols-3 gap-x-6 gap-y-4">
      {keyboard.map((item) => (
        <button
          key={item.num}
          type="button"
          className="
            flex flex-col items-center justify-center
            w-16 h-16 rounded-full
            bg-white/60 dark:bg-slate-800/60
            border border-slate-200 dark:border-slate-700
            shadow-sm
            hover:bg-blue-50/60 dark:hover:bg-blue-900/30
            focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800
            transition-all
          "
          onClick={() => setPhoneNumber((prev) => prev + String(item.num))}
        >
          <span className="text-3xl font-semibold text-slate-700 dark:text-slate-100 select-none">{item.num}</span>
          <span className="text-xs text-slate-400 uppercase tracking-widest select-none">{item.text}</span>
        </button>
      ))}
    </div>
  </div>
);

export default KeyPad;
