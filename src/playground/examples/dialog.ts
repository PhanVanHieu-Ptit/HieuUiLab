import { registryHref, getImplementedEntry } from '@/registry'

import { formatImport, jsxOpenTag, jsxTextElement, indent } from '../code'
import {
  booleanControl,
  defineControls,
  enumControl,
  stringControl,
  type ValuesOf,
} from '../controls'
import { definePlaygroundExample } from '../example'
import { DialogStage, type DialogConfig } from './dialog-stage'

const controls = defineControls({
  title: stringControl({
    label: 'Title',
    default: 'Delete this component?',
    required: true,
    maxLength: 80,
  }),
  description: stringControl({
    label: 'Description',
    default: 'Its page and demos are removed from the registry. This cannot be undone.',
    maxLength: 200,
  }),
  showClose: booleanControl({ label: 'Close button', default: true }),
  confirmLabel: stringControl({
    label: 'Confirm label',
    default: 'Delete',
    required: true,
    maxLength: 30,
  }),
  confirmVariant: enumControl({
    label: 'Confirm style',
    options: ['default', 'destructive'],
    default: 'destructive',
    display: 'segmented',
  }),
})

function resolve(values: ValuesOf<typeof controls>): DialogConfig {
  return {
    ...values,
    description: values.description.trim() === '' ? undefined : values.description,
  }
}

/** A self-contained component; nothing here is specific to the playground. */
function code(config: DialogConfig): string {
  const { title, description, showClose, confirmLabel, confirmVariant } = config
  const contentProps = [
    ...(showClose ? [] : ['showClose={false}']),
    ...(description === undefined ? ['aria-describedby={undefined}'] : []),
  ]
  const confirmProps = confirmVariant === 'default' ? [] : [`variant="${confirmVariant}"`]

  const dialogNames = [
    'Dialog',
    'DialogClose',
    'DialogContent',
    ...(description === undefined ? [] : ['DialogDescription']),
    'DialogFooter',
    'DialogHeader',
    'DialogTitle',
    'DialogTrigger',
  ]
  const lines = [
    formatImport(['Button'], '@/components/ui/button'),
    formatImport(dialogNames, '@/components/ui/dialog'),
    '',
    'export function DialogExample() {',
    '  return (',
    ...indent(
      [
        '<Dialog>',
        '  <DialogTrigger asChild>',
        '    <Button variant="outline">Open dialog</Button>',
        '  </DialogTrigger>',
        ...indent(jsxOpenTag('DialogContent', contentProps, 3), 2),
        '    <DialogHeader>',
        ...indent(jsxTextElement('DialogTitle', [], title, 5), 6),
        ...(description === undefined
          ? []
          : indent(jsxTextElement('DialogDescription', [], description, 5), 6)),
        '    </DialogHeader>',
        '    <DialogFooter>',
        '      <DialogClose asChild>',
        '        <Button variant="ghost">Cancel</Button>',
        '      </DialogClose>',
        '      <DialogClose asChild>',
        ...indent(jsxTextElement('Button', confirmProps, confirmLabel, 6), 8),
        '      </DialogClose>',
        '    </DialogFooter>',
        '  </DialogContent>',
        '</Dialog>',
      ],
      4,
    ),
    '  )',
    '}',
    '',
  ]
  return lines.join('\n')
}

const entry = getImplementedEntry('dialog')

export const dialogExample = definePlaygroundExample({
  id: 'dialog',
  title: 'Dialog',
  description: 'Title, description, close button, and the confirm action of a modal dialog.',
  ...(entry ? { docsHref: registryHref(entry) } : {}),
  note: 'A dialog is modal: while it is open the controls are inert. Close it with Esc or a button, then change them.',
  controls,
  height: 'lg',
  resolve,
  Stage: DialogStage,
  code,
})
