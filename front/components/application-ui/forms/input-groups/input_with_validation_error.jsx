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
import { ExclamationCircleIcon } from '@heroicons/react/20/solid'

export default function Example() {
  return (
    <div>
      <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
        Email
      </label>
      <div className="relative mt-2 rounded-md shadow-sm">
        <input
          defaultValue="adamwathan"
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          aria-invalid="true"
          aria-describedby="email-error"
          className="block w-full rounded-md border-0 py-1.5 pr-10 text-red-900 ring-1 ring-inset ring-red-300 placeholder:text-red-300 focus:ring-2 focus:ring-inset focus:ring-red-500 sm:text-sm sm:leading-6"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
          <ExclamationCircleIcon aria-hidden="true" className="h-5 w-5 text-red-500" />
        </div>
      </div>
      <p id="email-error" className="mt-2 text-sm text-red-600">
        Not a valid email address.
      </p>
    </div>
  )
}
