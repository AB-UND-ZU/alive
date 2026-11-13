import React, { ReactNode } from "react";
import Reconciler from "react-reconciler";
import { frameToAnsi, TerminalFrame } from "./frame";

type Props = { frame: TerminalFrame };
type Node = { props: Props };
type Container = { children: Node[]; write: (output: string) => void };

// The terminal has one host surface. Game components remain ordinary React.
const reconciler = Reconciler<
  string,
  Props,
  Container,
  Node,
  Node,
  never,
  never,
  Node,
  null,
  Props,
  never,
  ReturnType<typeof setTimeout>,
  -1
>({
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: true,
  now: Date.now,
  getRootHostContext: () => null,
  getChildHostContext: () => null,
  getPublicInstance: (node) => node,
  prepareForCommit: () => null,
  preparePortalMount: () => {},
  resetAfterCommit: (container) => {
    const node = container.children[0];
    if (node) container.write(frameToAnsi(node.props.frame));
  },
  createInstance: (_type, props) => ({ props }),
  createTextInstance: () => {
    throw new Error("Terminal text must be placed in a frame");
  },
  appendInitialChild: () => {},
  appendChild: () => {},
  appendChildToContainer: (container, child) => {
    container.children.push(child);
  },
  removeChildFromContainer: (container, child) => {
    container.children = container.children.filter((node) => node !== child);
  },
  clearContainer: (container) => {
    container.children = [];
  },
  finalizeInitialChildren: () => false,
  shouldSetTextContent: () => false,
  prepareUpdate: (_node, _type, _old, props) => props,
  commitUpdate: (node, props) => {
    node.props = props;
  },
  scheduleTimeout: setTimeout,
  cancelTimeout: clearTimeout,
  noTimeout: -1,
  ...{ detachDeletedInstance: () => {} },
});

export const TerminalScreen = ({ frame }: Props) =>
  React.createElement("terminal-screen", { frame });

export const createTerminalRoot = (write: (output: string) => void) => {
  const container: Container = { children: [], write };
  const root = reconciler.createContainer(
    container,
    0,
    null,
    false,
    null,
    "",
    console.error,
    null
  );
  return {
    render: (node: ReactNode) => reconciler.updateContainer(node, root, null),
    unmount: () => reconciler.updateContainer(null, root, null),
  };
};
