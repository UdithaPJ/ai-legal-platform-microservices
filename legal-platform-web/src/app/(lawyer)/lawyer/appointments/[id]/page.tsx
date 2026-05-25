export default async function LawyerAppointmentDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Appointment Detail</h1>
      <p className="text-muted-foreground mt-2">Appointment ID: {id}</p>
    </div>
  );
}
