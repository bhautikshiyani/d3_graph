import React, { useEffect, useRef } from 'react';
import './App.css';
import * as d3 from 'd3';
import { useContainerDimensions } from './hooks/useContainerDimensions';
import config from './config';
import data from './data';


const App = () => {
  const componentRef = useRef()
  const { width, height } = useContainerDimensions(componentRef)

  const svgRef = React.useRef(null);

  useEffect(() => {
    // Remove the unnecessary redeclaration of width and height
    const drag = simulation => {
      function dragstarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      }
  
      function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
      }
  
      function dragended(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      }
  
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }
  
    // Compute the graph and start the force simulation.
    const root = d3.hierarchy(data);
    const links = root.links();
    const nodes = root.descendants();
  
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(500).strength(2))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("x", d3.forceX())
      .force("y", d3.forceY());
  
    // Clear old graph
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr("width", width)
      .attr("height", height)
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("style", "max-width: 100%; height: auto;");
  
    // Append links with configurable link properties.
    const link = svg.append("g")
      .attr("stroke", config.linkColor) // Using config for link color
      .attr("stroke-opacity", config.linkOpacity) // Using config for link opacity
      .selectAll("line")
      .data(links)
      .join("line");
  
    const nodeParent = svg.append("g")
      .attr("class", "node-group")
      .selectAll("g")
      .data(nodes)
      .enter().append("g")
      .call(drag(simulation));
  
    // Append a div for each node using configurable node image properties.
    const nodeDiv = nodeParent.append("foreignObject")
      .attr("width", 100) // Set the width of the div
      .attr("height", 50); // Set the height of the div
  
    // Append HTML elements to the div using config object.
    nodeDiv.append("xhtml:div")
      .html(d => `
      <div style="display: flex; flex-direction: row">
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
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);
  
      nodeDiv
        .attr("x", d => d.x)
        .attr("y", d => d.y - 25);
    });
  
    const zoom = d3.zoom()
      .scaleExtent([config.zoom.minScale, config.zoom.maxScale]) // Using config for zoom levels
      .on('zoom', (event) => {
        link.attr("transform", event.transform);
        nodeDiv.attr("transform", event.transform);
      });
  
    // Apply zoom behavior to the SVG element
    svg.call(zoom);
  
    return () => simulation.stop();
  }, [config, width, height]); // Ensure width and height from custom hook are dependencies
  

  return (
    <div ref={componentRef} style={{height:'calc(100vh - 20px)', width:'100vw'}}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default App;
