export default function TagInput({
  label,
  placeholder,
  value,
  onChange,
  error,
  description,
}) {
  function addItem(event) {
    event.preventDefault();
    const input = event.target.elements.tagInput;
    if (!input || !input.value.trim()) return;
    const nextTag = input.value.trim();
    if (value.includes(nextTag)) {
      input.value = "";
      return;
    }
    onChange([...value, nextTag]);
    input.value = "";
  }

  function removeTag(index) {
    onChange(value.filter((_, idx) => idx !== index));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">{label}</label>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
      <form onSubmit={addItem} className="flex gap-2 flex-col sm:flex-row">
        <input
          name="tagInput"
          type="text"
          placeholder={placeholder}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-colors text-sm"
        />
        <button
          type="submit"
          className="w-full sm:w-auto bg-gray-900 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          Add
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <button
            key={`${tag}-${index}`}
            type="button"
            onClick={() => removeTag(index)}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200"
          >
            <span>{tag}</span>
            <span className="text-gray-500">×</span>
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
