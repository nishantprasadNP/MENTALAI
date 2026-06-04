export default function OnboardingStepper({ step }) {
  const steps = ["Profile", "Interests", "Genres", "Goals", "Review"];
  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 overflow-x-auto pb-4">
        {steps.map((label, index) => {
          const stepNumber = index + 1;
          const completed = stepNumber < step;
          const isActive = stepNumber === step;
          return (
            <div key={label} className="flex items-center gap-3 min-w-[120px]">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
                  completed
                    ? "border-gray-900 bg-gray-900 text-white"
                    : isActive
                    ? "border-gray-900 bg-white text-gray-900"
                    : "border-gray-200 bg-white text-gray-400"
                }`}
              >
                {stepNumber}
              </div>
              <div className="min-w-[70px] text-sm">
                <p className={`font-semibold ${isActive ? "text-gray-900" : "text-gray-500"}`}>{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-gray-900 transition-all duration-300"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
    </div>
  );
}
