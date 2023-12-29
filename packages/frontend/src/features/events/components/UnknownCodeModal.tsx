import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import useZodForm from "../../../hooks/useZodForm";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Controller } from "react-hook-form";
import { LoadingButton } from "@mui/lab";
import useScanin from "../hooks/useScanin";
import { trpc } from "@/trpcClient";
import { useDisclosure } from "../../../hooks/useDisclosure";
import useCreateUserScancode from "../../user/hooks/useCreateUserScancode";
import { TRPCClientError } from "@trpc/client";
import { useDebounce } from "usehooks-ts";
import { keepPreviousData } from "@tanstack/react-query";

interface UnknownCodeModalProps {
  code: string;
  eventId: string;
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
}

const UserOptionSchema = z.object({
  label: z.string().nonempty(),
  value: z.string().nonempty(),
});

const RegisterNewCodeFormSchema = z.object({
  code: z
    .string()
    .nonempty({
      message: "Scancode code cannot be empty",
    })
    .regex(/^[a-zA-Z0-9]+$/, {
      message: "Scancode code must be alphanumeric",
    })
    .min(6),
  userOption: UserOptionSchema.nullable().default(null),
});

export default function UnknownCodeModal(props: UnknownCodeModalProps) {
  const { code, open, onClose, eventId } = props;
  const {
    getDisclosureProps: getAutocompleteDisclosureProps,
    isOpen: isAutocompleteOpen,
  } = useDisclosure();

  const [inputValue, setInputValue] = useState("");

  const debouncedInputValue = useDebounce(inputValue, 500);

  const usersQuery = trpc.users.getUserList.useInfiniteQuery(
    {
      search: debouncedInputValue,
      limit: 10,
    },
    {
      enabled: isAutocompleteOpen,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      placeholderData: keepPreviousData,
    }
  );

  const userOption = useMemo(
    () =>
      usersQuery.data?.pages
        ?.flatMap((page) => page.items)
        .map((user) => ({
          label: user.username,
          value: user.id,
        })) ?? [],
    [usersQuery.data]
  );

  const {
    register,
    formState: { isSubmitting, errors },
    handleSubmit,
    control,
    reset,
    setError,
  } = useZodForm({
    schema: RegisterNewCodeFormSchema,
    defaultValues: RegisterNewCodeFormSchema.parse({
      code,
    }),
  });

  useEffect(() => {
    reset({
      code,
    });
  }, [code, reset]);

  const createScancodeMutation = useCreateUserScancode();
  const scaninMutation = useScanin();

  const onSubmit = handleSubmit(async (data) => {
    if (!data.userOption) {
      setError("userOption", {
        message: "Please select a user",
        type: "required",
      });
      return;
    }

    try {
      await createScancodeMutation.mutateAsync({
        scancode: data.code,
        userId: data.userOption?.value,
      });
      scaninMutation.mutate({
        eventId,
        scancode: data.code,
      });

      onClose();
    } catch (error) {
      if (error instanceof TRPCClientError) {
        setError("code", {
          message: error.message,
        });
      } else {
        setError("code", {
          message: "An unknown error occurred",
        });
      }
    }
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      component={"form"}
      onSubmit={onSubmit}
    >
      <DialogTitle>Register new code</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To register a new code, please select a user to associate it with.
        </DialogContentText>
        <Stack
          gap={2}
          sx={{
            mt: 2,
          }}
        >
          <Controller
            control={control}
            name="userOption"
            render={({
              field: { onChange, ...rest },
              fieldState: { error },
            }) => (
              <Autocomplete
                options={userOption}
                loading={usersQuery.isFetching}
                renderInput={(props) => (
                  <TextField
                    {...props}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    required
                    label="User"
                    helperText={error?.message}
                    error={!!error}
                    placeholder="Select a user"
                  />
                )}
                onChange={(_event, data) => {
                  onChange(data);
                }}
                onInputChange={(_event, value) => {
                  setInputValue(value);
                }}
                isOptionEqualToValue={(option, value) =>
                  option.value === value.value
                }
                {...getAutocompleteDisclosureProps()}
                {...rest}
              />
            )}
          />

          <TextField
            {...register("code")}
            label="Code"
            required
            helperText={
              errors.code?.message ?? "Scan the card you want to add."
            }
            error={!!errors.code}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <LoadingButton type="submit" disabled={isSubmitting}>
          Register
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
