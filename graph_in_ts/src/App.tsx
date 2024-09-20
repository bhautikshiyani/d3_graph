import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import config from './config';
import data from './data';
import { useContainerDimensions } from './hooks/useContainerDimensions';

interface NodeData {
  name: string;
  url: string;
  other_details: string;
}

interface Node extends d3.HierarchyPointNode<NodeData> {
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: Node;
  target: Node;
}

const App: React.FC = () => {
  const componentRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { width, height } = useContainerDimensions(componentRef);

  useEffect(() => {
    const drag = (simulation: d3.Simulation<Node, Link>) => {
      const dragstarted = (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      };

      const dragged = (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) => {
        d.fx = event.x;
        d.fy = event.y;
      };

      const dragended = (event: d3.D3DragEvent<SVGGElement, Node, Node>, d: Node) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      };

      return d3.drag<SVGGElement, Node>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    };

    const root = d3.hierarchy<NodeData>(data);
    const links = root.links() as Link[];
    const nodes = root.descendants() as Node[];

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink<Node, Link>(links).id((d: any) => d.id).distance(100).strength(1))
      .force("charge", d3.forceManyBody().strength(-1500))
      .force("x", d3.forceX())
      .force("y", d3.forceY());

    const svg = d3.select(svgRef.current!); // Non-null assertion for TypeScript
    svg.selectAll('*').remove();
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height].join(' '))
      .attr("style", "max-width: 100%; height: auto;");

    // Add marker definition for arrows
    svg.append("defs").append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", config.imageSize.width / 2 + 3)  // Adjust depending on link width
      .attr("refY", 0)
      .attr("markerWidth", 15)
      .attr("markerHeight", 15)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", config.linkColor);

    const link = svg.append("g")
      .attr("stroke", config.linkColor)
      .attr("stroke-opacity", config.linkOpacity)
      .selectAll("line")
      .data(links)
      .join("line")
      .attr('marker-end', 'url(#arrow)')
      .attr("stroke-width", config.linkWidth);

    const nodeParent = svg.append("g")
      .attr("class", "node-group")
      .selectAll<SVGGElement, Node>("g")
      .data(nodes)
      .enter().append("g")
      .call(drag(simulation));

    const foreignObjectWidth = 150;
    const foreignObjectHeight = 70;

    const nodeDiv = nodeParent.append("foreignObject")
      .attr("width", foreignObjectWidth)  // Set custom width
      .attr("height", foreignObjectHeight)  // Set custom height

    nodeDiv.append("xhtml:div")
      .html(d => `
      <div style="display: flex; flex-direction: row; align-items: center;">
        <div style="display: flex;">
          <img src="${d.data.url}" 
            style="width: ${config.imageSize.width}px; height: ${config.imageSize.height}px; 
            border-radius: ${config.imageBorderRadius}; 
            border: 2px solid ${config.imageBorderColor}" />
        </div>
        <div style="display: flex; flex-direction: column; margin-left: 5px;">
          <div style="font-size: ${config.textSize}; font-weight: bold">${d.data.name}</div>
          <div style="font-size: 13px">${d.data.other_details}</div>
        </div>
      </div>
      `);

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      // Center the foreignObject on the node
      nodeDiv
        .attr("x", d => d.x! - config.imageSize.width / 2)  // Offset to center horizontally
        .attr("y", d => d.y! - config.imageSize.height / 2);  // Offset to center vertically
    });

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([config.zoom.minScale, config.zoom.maxScale])
      .on('zoom', (event) => {
        link.attr("transform", event.transform);
        nodeDiv.attr("transform", event.transform);
      });

    if (svgRef.current) {
      d3.select(svgRef.current).call(zoom);
    }

    return () => {
      simulation.stop();
    };
  }, [config, width, height]);

  return (
    <div ref={componentRef} style={{ height: 'calc(100vh - 20px)', width: '100vw' }}>
      <svg ref={svgRef}></svg>
    </div>
  );
};

export default App;
