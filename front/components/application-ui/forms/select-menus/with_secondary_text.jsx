'use client'

import { useState } from 'react'
import { Label, Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { CheckIcon, ChevronUpDownIcon } from '@heroicons/react/20/solid'

const people = [
  { name: 'Wade Cooper', username: '@wadecooper' },
  { name: 'Arlene Mccoy', username: '@arlenemccoy' },
  { name: 'Devon Webb', username: '@devonwebb' },
  { name: 'Tom Cook', username: '@tomcook' },
  { name: 'Tanya Fox', username: '@tanyafox' },
  { name: 'Hellen Schmidt', username: '@hellenschmidt' },
  { name: 'Caroline Schultz', username: '@carolineschultz' },
  { name: 'Mason Heaney', username: '@masonheaney' },
  { name: 'Claudie Smitham', username: '@claudiesmitham' },
  { name: 'Emil Schaefer', username: '@emilschaefer' },
]

export default function Example() {
  const [selected, setSelected] = useState(people[3])

  return (
    <Listbox value={selected} onChange={setSelected}>
      <Label className="block text-sm font-medium leading-6 text-gray-900">Assigned to</Label>
      <div className="relative mt-2">
        <ListboxButton className="relative w-full cursor-default rounded-md bg-white py-1.5 pl-3 pr-10 text-left text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm sm:leading-6">
          <span className="inline-flex w-full truncate">
            <span className="truncate">{selected.name}</span>
            <span className="ml-2 truncate text-gray-500">{selected.username}</span>
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <ChevronUpDownIcon aria-hidden="true" className="h-5 w-5 text-gray-400" />
          </span>
        </ListboxButton>

        <ListboxOptions
          transition
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none data-[closed]:data-[leave]:opacity-0 data-[leave]:transition data-[leave]:duration-100 data-[leave]:ease-in sm:text-sm"
        >
          {people.map((person) => (
            <ListboxOption
              key={person.username}
              value={person}
              className="group relative cursor-default select-none py-2 pl-3 pr-9 text-gray-900 data-[focus]:bg-indigo-600 data-[focus]:text-white"
            >
              <div className="flex">
                <span className="truncate font-normal group-data-[selected]:font-semibold">{person.name}</span>
                <span className="ml-2 truncate text-gray-500 group-data-[focus]:text-indigo-200">
                  {person.username}
                </span>
              </div>

              <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600 group-data-[focus]:text-white [.group:not([data-selected])_&]:hidden">
                <CheckIcon aria-hidden="true" className="h-5 w-5" />
              </span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  )
}
