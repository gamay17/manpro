import { useState } from "react";
import { Search } from "lucide-react";

const SearchBar = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full max-w-xl mt-4">
      <Search className="w-5 h-5 text-gray-500" />
      <input
        type="text"
        placeholder="Search..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="ml-2 bg-transparent outline-none w-full text-l "
      />
    </div>
  );
};

export default SearchBar;
