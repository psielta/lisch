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
    <fieldset className="border-b border-t border-gray-200">
      <legend className="sr-only">Notifications</legend>
      <div className="divide-y divide-gray-200">
        <div className="relative flex items-start pb-4 pt-3.5">
          <div className="min-w-0 flex-1 text-sm leading-6">
            <label htmlFor="comments" className="font-medium text-gray-900">
              Comments
            </label>
            <p id="comments-description" className="text-gray-500">
              Get notified when someones posts a comment on a posting.
            </p>
          </div>
          <div className="ml-3 flex h-6 items-center">
            <input
              id="comments"
              name="comments"
              type="checkbox"
              aria-describedby="comments-description"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
        </div>
        <div className="relative flex items-start pb-4 pt-3.5">
          <div className="min-w-0 flex-1 text-sm leading-6">
            <label htmlFor="candidates" className="font-medium text-gray-900">
              Candidates
            </label>
            <p id="candidates-description" className="text-gray-500">
              Get notified when a candidate applies for a job.
            </p>
          </div>
          <div className="ml-3 flex h-6 items-center">
            <input
              id="candidates"
              name="candidates"
              type="checkbox"
              aria-describedby="candidates-description"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
        </div>
        <div className="relative flex items-start pb-4 pt-3.5">
          <div className="min-w-0 flex-1 text-sm leading-6">
            <label htmlFor="offers" className="font-medium text-gray-900">
              Offers
            </label>
            <p id="offers-description" className="text-gray-500">
              Get notified when a candidate accepts or rejects an offer.
            </p>
          </div>
          <div className="ml-3 flex h-6 items-center">
            <input
              id="offers"
              name="offers"
              type="checkbox"
              aria-describedby="offers-description"
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
          </div>
        </div>
      </div>
    </fieldset>
  )
}
