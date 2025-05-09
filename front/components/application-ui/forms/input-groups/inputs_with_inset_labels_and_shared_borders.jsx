/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
export default function Example() {
  return (
    <div className="isolate -space-y-px rounded-md shadow-sm">
      <div className="relative rounded-md rounded-b-none px-3 pb-1.5 pt-2.5 ring-1 ring-inset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600">
        <label htmlFor="name" className="block text-xs font-medium text-gray-900">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder="Jane Smith"
          className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
        />
      </div>
      <div className="relative rounded-md rounded-t-none px-3 pb-1.5 pt-2.5 ring-1 ring-inset ring-gray-300 focus-within:z-10 focus-within:ring-2 focus-within:ring-indigo-600">
        <label htmlFor="job-title" className="block text-xs font-medium text-gray-900">
          Job Title
        </label>
        <input
          id="job-title"
          name="job-title"
          type="text"
          placeholder="Head of Tomfoolery"
          className="block w-full border-0 p-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
        />
      </div>
    </div>
  )
}
