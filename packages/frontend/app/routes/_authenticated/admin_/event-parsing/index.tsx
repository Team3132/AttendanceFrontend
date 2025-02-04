import DefaultAppBar from "@/components/DefaultAppBar";
import { LinkIconButton } from "@/components/LinkIconButton";
import useDeleteRule from "@/features/admin/hooks/useDeleteRule";
import useSyncCalendar from "@/features/admin/hooks/useSyncCalendar";
import useTriggerRule from "@/features/admin/hooks/useTriggerRule";
import { adminQueries } from "@/queries/adminQueries";
import {
  Button,
  Container,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
} from "@mui/material";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { FaCopy, FaPen, FaPlay, FaTrash } from "react-icons/fa6";

export const Route = createFileRoute("/_authenticated/admin_/event-parsing/")({
  loader: ({ context: { queryClient } }) => {
    queryClient.prefetchQuery(adminQueries.eventParsingRules);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const parsingRulesQuery = useSuspenseQuery(adminQueries.eventParsingRules);
  const navigate = Route.useNavigate();

  const deleteRuleMutation = useDeleteRule();
  const triggerRuleMutation = useTriggerRule();

  const handleDuplicateRule = (id: string) => {
    const rule = parsingRulesQuery.data.find((r) => r.id === id);

    if (!rule) return;

    navigate({
      to: "/admin/event-parsing/create",
      search: {
        name: `${rule.kronosRule.title} (Copy)`,
        regex: rule.regex,
        roleIds: rule.roleIds,
        cronExpr: rule.kronosRule.cronExpr,
        channelId: rule.channelId,
      },
    });
  };

  const syncEventsMutation = useSyncCalendar();

  const handleDeleteRule = (id: string) =>
    deleteRuleMutation.mutate({ data: id });

  const handleTriggerRule = (id: string) =>
    triggerRuleMutation.mutate({ data: id });

  const syncEvents = () => syncEventsMutation.mutate();

  return (
    <>
      <DefaultAppBar title="Admin - Event Parsing" />
      <Container sx={{ my: 2, flex: 1, overflowY: "auto" }}>
        <List>
          {parsingRulesQuery.data.map((rule) => (
            <ListItem
              disablePadding
              key={rule.id}
              secondaryAction={
                <Stack direction={"row"} gap={2}>
                  <IconButton onClick={() => handleDeleteRule(rule.id)}>
                    <FaTrash />
                  </IconButton>
                  <IconButton onClick={() => handleDuplicateRule(rule.id)}>
                    <FaCopy />
                  </IconButton>
                  <IconButton
                    onClick={() => handleTriggerRule(rule.id)}
                    disabled={triggerRuleMutation.isPending}
                  >
                    <FaPlay />
                  </IconButton>
                  <LinkIconButton
                    to="/admin/event-parsing/$ruleId"
                    params={{
                      ruleId: rule.id,
                    }}
                  >
                    <FaPen />
                  </LinkIconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={rule.kronosRule.title}
                secondary={rule.priority}
              />
            </ListItem>
          ))}
        </List>
        <Stack direction={"row"} gap={2}>
          <Button
            onClick={syncEvents}
            loading={syncEventsMutation.isPending}
            variant="contained"
          >
            Sync Events
          </Button>
        </Stack>
      </Container>
    </>
  );
}
