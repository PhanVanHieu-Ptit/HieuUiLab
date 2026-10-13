import type { PropDoc } from '@/registry/types'

export function PropsTable({ props, caption }: { props: readonly PropDoc[]; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2 font-medium">
              Prop
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Default
            </th>
            <th scope="col" className="px-4 py-2 font-medium">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {props.map((prop) => (
            <tr key={prop.name} className="align-top">
              <th scope="row" className="px-4 py-3 font-mono text-xs font-medium whitespace-nowrap">
                {prop.name}
              </th>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{prop.type}</td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {prop.default ?? '—'}
              </td>
              <td className="px-4 py-3">{prop.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
