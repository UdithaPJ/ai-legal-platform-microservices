export default async function LawyerChatPage(props: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await props.params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Chat</h1>
      <p className="text-muted-foreground mt-2">Conversation ID: {conversationId}</p>
    </div>
  );
}
