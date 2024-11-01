import { eventQueryKeys } from "@/queries/events.queries";
<<<<<<< HEAD
import { trpcClient } from "@/trpcClient";
=======
import { proxyClient } from "@/trpcClient";
>>>>>>> 5fa3d80667af05e512045626e9733865eeaf59b8
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export default function useUpdateRsvp() {
  const queryClient = useQueryClient();

  return useMutation({
<<<<<<< HEAD
    mutationFn: trpcClient.events.editSelfRsvp.mutate,
=======
    mutationFn: proxyClient.events.editSelfRsvp.mutate,
>>>>>>> 5fa3d80667af05e512045626e9733865eeaf59b8
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: eventQueryKeys.eventRsvp(data.eventId),
      });
      queryClient.invalidateQueries({
        queryKey: eventQueryKeys.eventRsvps(data.eventId),
      });
    },
  });
}
