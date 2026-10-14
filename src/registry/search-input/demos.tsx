import { useState } from 'react'

import { Label } from '@/components/ui/label'
import { SearchInput } from '@/components/ui/search-input'

export function SearchInputDemo() {
  const [query, setQuery] = useState('dialog')
  const components = ['Button', 'Checkbox', 'Dialog', 'Select', 'Switch', 'Tabs', 'Tooltip']
  const matches = components.filter((name) => name.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <form
        role="search"
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <Label htmlFor="search-components">Search components</Label>
        <SearchInput
          id="search-components"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
          onClear={() => {
            setQuery('')
          }}
        />
      </form>
      <p role="status" className="text-xs text-muted-foreground">
        {matches.length === 1 ? '1 match' : `${String(matches.length)} matches`}
      </p>
      <ul className="text-sm">
        {matches.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
    </div>
  )
}

export function SearchInputSizesDemo() {
  return (
    <div className="grid w-full max-w-sm gap-3">
      <SearchInput aria-label="Search (small)" size="sm" placeholder="Small" />
      <SearchInput aria-label="Search (medium)" placeholder="Medium" />
      <SearchInput aria-label="Search (disabled)" placeholder="Disabled" disabled />
    </div>
  )
}
