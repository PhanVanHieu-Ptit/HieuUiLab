import { Spinner } from '@/components/ui/spinner'

export function SpinnerDemo() {
  return (
    <div className="flex items-center gap-6">
      <Spinner />
      <Spinner label="Saving changes" className="gap-2 text-sm [&_svg]:size-5">
        <span aria-hidden="true">Saving…</span>
      </Spinner>
    </div>
  )
}
