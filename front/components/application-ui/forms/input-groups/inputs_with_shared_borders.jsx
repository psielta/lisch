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
    <div>
      <fieldset>
        <legend className="block text-sm font-medium leading-6 text-gray-900">Card Details</legend>
        <div className="mt-2 -space-y-px rounded-md bg-white shadow-sm">
          <div>
            <label htmlFor="card-number" className="sr-only">
              Card number
            </label>
            <input
              id="card-number"
              name="card-number"
              type="text"
              placeholder="Card number"
              className="relative block w-full rounded-none rounded-t-md border-0 bg-transparent py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
          <div className="flex -space-x-px">
            <div className="w-1/2 min-w-0 flex-1">
              <label htmlFor="card-expiration-date" className="sr-only">
                Expiration date
              </label>
              <input
                id="card-expiration-date"
                name="card-expiration-date"
                type="text"
                placeholder="MM / YY"
                className="relative block w-full rounded-none rounded-bl-md border-0 bg-transparent py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
            <div className="min-w-0 flex-1">
              <label htmlFor="card-cvc" className="sr-only">
                CVC
              </label>
              <input
                id="card-cvc"
                name="card-cvc"
                type="text"
                placeholder="CVC"
                className="relative block w-full rounded-none rounded-br-md border-0 bg-transparent py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
        </div>
      </fieldset>
      <fieldset className="mt-6 bg-white">
        <legend className="block text-sm font-medium leading-6 text-gray-900">Billing address</legend>
        <div className="mt-2 -space-y-px rounded-md shadow-sm">
          <div>
            <label htmlFor="country" className="sr-only">
              Country
            </label>
            <select
              id="country"
              name="country"
              autoComplete="country-name"
              className="relative block w-full rounded-none rounded-t-md border-0 bg-transparent py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            >
              <option>United States</option>
              <option>Canada</option>
              <option>Mexico</option>
            </select>
          </div>
          <div>
            <label htmlFor="postal-code" className="sr-only">
              ZIP / Postal code
            </label>
            <input
              id="postal-code"
              name="postal-code"
              type="text"
              placeholder="ZIP / Postal code"
              autoComplete="postal-code"
              className="relative block w-full rounded-none rounded-b-md border-0 bg-transparent py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>
      </fieldset>
    </div>
  )
}
