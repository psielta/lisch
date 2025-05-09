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
'use client'

import { useState } from 'react'
import { Radio, RadioGroup } from '@headlessui/react'

const plans = [
  { name: 'Startup', priceMonthly: '$29', priceYearly: '$290', limit: 'Up to 5 active job postings' },
  { name: 'Business', priceMonthly: '$99', priceYearly: '$990', limit: 'Up to 25 active job postings' },
  { name: 'Enterprise', priceMonthly: '$249', priceYearly: '$2490', limit: 'Unlimited active job postings' },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Example() {
  const [selected, setSelected] = useState(plans[0])

  return (
    <fieldset aria-label="Pricing plans">
      <RadioGroup value={selected} onChange={setSelected} className="relative -space-y-px rounded-md bg-white">
        {plans.map((plan, planIdx) => (
          <Radio
            key={plan.name}
            value={plan}
            aria-label={plan.name}
            aria-description={`${plan.priceMonthly} per month, ${plan.priceYearly} per year, ${plan.limit}`}
            className={classNames(
              planIdx === 0 ? 'rounded-tl-md rounded-tr-md' : '',
              planIdx === plans.length - 1 ? 'rounded-bl-md rounded-br-md' : '',
              'group relative flex cursor-pointer flex-col border border-gray-200 p-4 focus:outline-none data-[checked]:z-10 data-[checked]:border-indigo-200 data-[checked]:bg-indigo-50 md:grid md:grid-cols-3 md:pl-4 md:pr-6',
            )}
          >
            <span className="flex items-center text-sm">
              <span
                aria-hidden="true"
                className="flex h-4 w-4 items-center justify-center rounded-full border border-gray-300 bg-white group-data-[checked]:border-transparent group-data-[checked]:bg-indigo-600 group-data-[focus]:ring-2 group-data-[focus]:ring-indigo-600 group-data-[focus]:ring-offset-2"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
              </span>
              <span className="ml-3 font-medium text-gray-900 group-data-[checked]:text-indigo-900">{plan.name}</span>
            </span>
            <span className="ml-6 pl-1 text-sm md:ml-0 md:pl-0 md:text-center">
              <span className="font-medium text-gray-900 group-data-[checked]:text-indigo-900">
                {plan.priceMonthly} / mo
              </span>{' '}
              <span className="text-gray-500 group-data-[checked]:text-indigo-700">({plan.priceYearly} / yr)</span>
            </span>
            <span className="ml-6 pl-1 text-sm text-gray-500 group-data-[checked]:text-indigo-700 md:ml-0 md:pl-0 md:text-right">
              {plan.limit}
            </span>
          </Radio>
        ))}
      </RadioGroup>
    </fieldset>
  )
}
