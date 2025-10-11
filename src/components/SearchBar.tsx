import { useState } from "react";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2 w-full max-w-xl mt-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="ml-3 bg-transparent outline-none w-full text-gray-700 placeholder-gray-400 text-sm sm:text-base"
      />
    </div>
  );
};

export default SearchBar;
