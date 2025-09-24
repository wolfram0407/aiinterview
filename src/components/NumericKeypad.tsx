"use client";

interface NumericKeypadProps {
  onNumberClick: (number: string) => void;
  onBackspace: () => void;
}

export default function NumericKeypad({ onNumberClick, onBackspace }: NumericKeypadProps) {
  const keypadNumbers = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "←"],
  ];

  const handleKeyClick = (item: string) => {
    if (item === "←") {
      onBackspace();
    } else if (item !== "") {
      onNumberClick(item);
    }
  };

  return (
    <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
      {keypadNumbers.flat().map((item, index) => (
        <button
          key={index}
          onClick={() => handleKeyClick(item)}
          disabled={item === ""}
          className={`aspect-square flex items-center justify-center text-2xl font-bold rounded-lg transition-colors ${
            item === "" ? "bg-transparent cursor-default" : "text-black bg-transparent hover:bg-gray-100"
          }`}
        >
          {item === "←" ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            item
          )}
        </button>
      ))}
    </div>
  );
}
