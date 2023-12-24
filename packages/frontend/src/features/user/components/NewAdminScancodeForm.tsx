import { z } from "zod";
import useZodForm from "../../../hooks/useZodForm";
import { ListItem, TextField } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import useCreateUserScancode from "../hooks/useCreateUserScancode";
import { TRPCClientError } from "@trpc/client";

const NewScancodeSchema = z.object({
  code: z
    .string()
    .min(6)
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Event code must be alphanumeric",
    }),
});

interface NewAdminScancodeListItemProps {
  userId: string;
}

export default function NewAdminScancodeListItem(
  props: NewAdminScancodeListItemProps
) {
  const { userId } = props;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
  } = useZodForm({
    schema: NewScancodeSchema,
    defaultValues: {
      code: "",
    },
  });

  const createUserScancodeMutation = useCreateUserScancode();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createUserScancodeMutation.mutateAsync({
        userId,
        scancode: data.code,
      });

      reset({
        code: "",
      });
    } catch (error) {
      if (error instanceof TRPCClientError) {
        setError("code", {
          message: error.message,
        });
      }
    }
  });

  return (
    <ListItem component={"form"} onSubmit={onSubmit}>
      <TextField
        required
        label={"New Scancode"}
        {...register("code", {
          required: "Event code cannot be empty",
        })}
        fullWidth
        error={!!errors.code}
        helperText={errors.code?.message}
      />
      <LoadingButton
        loading={isSubmitting}
        type={"submit"}
        variant="contained"
        size="large"
        sx={{
          ml: 2,
        }}
      >
        Create
      </LoadingButton>
    </ListItem>
  );
}
