'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  Position
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { PathData, SpanData } from '@/lib/data';
import { CustomSpanNode } from '@/components/CustomNodes';
import SpanDetailDrawer from '@/components/SpanDetailDrawer';
import { Download, ArrowLeft, Zap, Camera, Share2 } from 'lucide-react';
import Link from 'next/link';

interface TraceInspectorProps {
  run: PathData;
}

const nodeTypes = {
  customSpan: CustomSpanNode,
};

export default function TraceInspector({ run: path }: TraceInspectorProps) {
  const [selectedSpan, setSelectedSpan] = useState<SpanData | null>(null);

  // Convert Spans into React Flow nodes with vertical spacing & screenshot-worthy glowing layout
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const levelMap: { [spanId: string]: number } = {};

    path.spans.forEach((s, idx) => {
      levelMap[s.spanId] = idx;
    });

    path.spans.forEach((span, index) => {
      nodes.push({
        id: span.spanId,
        type: 'customSpan',
        position: {
          x: 320 + (index % 2 === 0 ? 0 : 80),
          y: 60 + index * 140,
        },
        data: { span },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      });

      if (span.parentSpanId || index > 0) {
        const sourceId = span.parentSpanId || path.spans[index - 1].spanId;
        const isFailed = span.status === 'FAILED';
        
        edges.push({
          id: `e-${sourceId}-${span.spanId}`,
          source: sourceId,
          target: span.spanId,
          animated: true,
          className: isFailed ? 'stroke-red-500 stroke-2' : 'animated-edge',
          style: {
            stroke: isFailed ? '#ef4444' : '#FC4C02',
            strokeWidth: 3.5,
          },
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [path]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const span = path.spans.find((s) => s.spanId === node.id);
    if (span) {
      setSelectedSpan(span);
    }
  }, [path]);

  const exportOTelJson = () => {
    const otelPayload = {
      traceId: `pf_trace_${path.id}`,
      serviceName: path.agent.name,
      framework: path.agent.framework,
      attributes: {
        "telemetry.sdk.name": "pathflow-python-sdk",
        "pathflow.velocity_tps": path.tps,
        "pathflow.compute_cost": path.cost,
        "pathflow.context_tokens": path.tokens,
        "pathflow.skill_segment": path.skillSegment
      },
      spans: path.spans
    };

    const blob = new Blob([JSON.stringify(otelPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pathflow-trace-${path.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
      
      {/* Header Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between border-b border-zinc-800 bg-zinc-900/90 px-6 py-3.5 backdrop-blur-md">
        
        {/* Title & Agent Info */}
        <div className="flex items-center gap-4">
          <Link
            href="/feed"
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs font-bold text-zinc-300 hover:border-strava-orange hover:text-strava-orange transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Feed
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">{path.title}</span>
              <span className="rounded bg-strava-orange/20 text-strava-orange border border-strava-orange/30 px-2 py-0.5 text-[10px] font-bold uppercase font-mono">
                {path.agent.name} ({path.skillSegment})
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">
              Completed by: <span className="text-white font-bold">{path.user.name}</span> • Model: <span className="text-strava-orange">{path.modelFamily}</span>
            </p>
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="flex items-center gap-3 font-telemetry">
          <div className="hidden sm:flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-extrabold block">VELOCITY</span>
              <span className="text-strava-orange font-bold font-telemetry">{path.tps} t/s</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-extrabold block">COMPUTE</span>
              <span className="text-emerald-400 font-bold font-telemetry">${path.cost.toFixed(3)}</span>
            </div>
            <div className="h-6 w-px bg-zinc-800" />
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-extrabold block">CONTEXT</span>
              <span className="text-white font-bold font-telemetry">{(path.tokens / 1000).toFixed(1)}k tok</span>
            </div>
          </div>

          <button
            onClick={exportOTelJson}
            className="flex items-center gap-2 rounded-xl bg-strava-orange px-4 py-2.5 text-xs font-bold text-white hover:bg-strava-hover transition-all shadow-lg shadow-strava-orange/20"
          >
            <Camera className="h-4 w-4" />
            Screenshot & Export OTel
          </button>
        </div>

      </div>

      {/* Screenshot-Worthy Animated Graph Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.8}
        >
          <Background color="#27272a" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const span = node.data?.span as SpanData;
              return span?.status === 'FAILED' ? '#ef4444' : '#FC4C02';
            }}
            maskColor="rgba(10, 10, 12, 0.8)"
          />
        </ReactFlow>

        {/* Graph Banner Pill */}
        <div className="absolute bottom-6 left-6 z-10 hidden sm:flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/90 px-4 py-2.5 text-xs text-zinc-300 backdrop-blur-md shadow-xl">
          <Zap className="h-4 w-4 text-strava-orange" />
          <span>Interactive Execution Graph: LLM → Search → Reflection → Browser → Search → Memory → Output</span>
        </div>
      </div>

      {/* Step Detail Drawer */}
      <SpanDetailDrawer
        span={selectedSpan}
        onClose={() => setSelectedSpan(null)}
      />

    </div>
  );
}
