import ControlledSelect from '@/components/ControlledSelect'
import ControlledTextField from '@/components/ControlledTextField'
import DefaultAppBar from '@/components/DefaultAppBar'
import useCreateEvent from '@/features/events/hooks/useCreateEvent'
import useZodForm from '@/hooks/useZodForm'
import { LoadingButton } from '@mui/lab'
import { Container, Stack, Switch } from '@mui/material'
import { DateTimePicker } from '@mui/x-date-pickers'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { CreateEventSchema } from 'backend/schema'
import { DateTime } from 'luxon'
import { useAlert } from 'react-alert'
import { Controller } from 'react-hook-form'

export const Route = createFileRoute('/_authenticated/events_/create')({
  component: Component,
  beforeLoad: async ({ context: { queryUtils } }) => {
    const { isAdmin, isAuthenticated } =
      await queryUtils.auth.status.ensureData()
    if (!isAdmin) {
      return {
        redirect: {
          to: '/',
        },
      }
    }
  },
})

function Component() {
  const {
    register,
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useZodForm({
    schema: CreateEventSchema,
    defaultValues: {
      description: '',
      title: '',
      startDate: DateTime.now().toISODate() ?? undefined,
      endDate: DateTime.now().toISODate() ?? undefined,
      allDay: false,
      type: 'Regular',
    },
  })

  const navigate = useNavigate()
  const alert = useAlert()

  const createEventMutation = useCreateEvent()

  const onSubmit = handleSubmit(async (data) => {
    try {
      const createdEvent = await createEventMutation.mutateAsync(data)
      alert.success('Event created')
      navigate({
        to: '/events/$eventId',
        params: {
          eventId: createdEvent.id,
        },
      })
    } catch (error) {
      console.error(error)
    }
  })

  return (
    <>
      <DefaultAppBar title="Create Event" />
      <Container sx={{ my: 2, flex: 1, overflowY: 'auto' }}>
        <Stack gap={2} py={2} component={'form'} onSubmit={onSubmit}>
          <ControlledTextField control={control} name="title" label="Title" />
          <ControlledTextField
            control={control}
            name="description"
            label="Description"
            multiline
            rows={3}
          />
          <Controller
            control={control}
            name="startDate"
            render={({ field: { onChange, value, ...rest } }) => (
              <DateTimePicker
                label="Start Date"
                value={DateTime.fromMillis(Date.parse(value ?? ''))}
                onChange={(v) => onChange(v?.toISO() ?? '')}
                {...rest}
              />
            )}
          />
          <Controller
            control={control}
            name="endDate"
            render={({ field: { onChange, value, ...rest } }) => (
              <DateTimePicker
                label="End Date"
                value={DateTime.fromMillis(Date.parse(value ?? ''))}
                onChange={(v) => onChange(v?.toISO() ?? '')}
                {...rest}
              />
            )}
          />
          <Switch {...register('allDay')} />
          <ControlledSelect
            control={control}
            name="type"
            label="Type"
            displayEmpty={true}
            options={[
              { label: 'All', value: undefined },
              { label: 'Outreach', value: 'Outreach' },
              { label: 'Regular', value: 'Regular' },
              { label: 'Social', value: 'Social' },
            ]}
          />
          <LoadingButton loading={isSubmitting} type="submit">
            Create
          </LoadingButton>
        </Stack>
      </Container>
    </>
  )
}
