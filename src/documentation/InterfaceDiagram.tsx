export function InterfaceDiagram({ base }: { base: string }) {
  return (
    <div className="InterfaceScroll">
      <iframe
        className="InterfaceDiagram"
        title="Game Interface"
        src={new URL("interface-preview.html", base).href}
        tabIndex={-1}
        style={{ width: 576, height: 640, border: 0, pointerEvents: "none" }}
      />
    </div>
  );
}
