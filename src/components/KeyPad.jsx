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
  return (
    <div className="flex justify-center items-center mt-3">
      <div className="grid grid-cols-3 gap-x-8 gap-y-4">
        {keyboard.map((item) => (
          <button
            key={item.num}
            className=" hover:bg-slate-200 hover:dark:bg-gray-600 flex flex-col items-center justify-center w-16 h-16 rounded-full dark:border-[#999] border-[#ddd] border dark:bg-[#333] bg-[#EAEAEA] shadow-sm focus:outline-none transition-colors duration-200"
            onClick={() => setPhoneNumber((prev) => prev + String(item.num))}
          >
            <span className="text-3xl font-semibold text-[#070707] dark:text-white">{item.num}</span>
            <span className="text-xs text-gray-600 uppercase dark:text-white">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default KeyPad;
