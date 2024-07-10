import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

interface TreeNode {
  id: string;
  callType?: string;
  children: TreeNode[];
}

@Component({
  selector: 'app-session-tree',
  standalone: true,
  templateUrl: './session-tree.component.html',
  styleUrls: ['./session-tree.component.css']
})
export class SessionTreeComponent implements OnInit, OnChanges {
  @Input() incomingEvents: { currentSessionId: string, retriggeredFromSessionId: string, serviceKey: string }[] = [];
  treeData: TreeNode | null = null;
  sessionIDs: string[] = [];

  ngOnInit() {
    if (this.incomingEvents.length > 0) {
      this.buildTree();
      this.renderTree();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['incomingEvents'] && this.incomingEvents.length > 0) {
      this.buildTree();
      this.renderTree();
    }
  }

  buildTree() {
    if (!this.incomingEvents || this.incomingEvents.length === 0) {
      console.error('No correlation results available to build the tree');
      return;
    }

    const nodeMap: { [key: string]: TreeNode } = {};

    this.incomingEvents.forEach(result => {
      if (!nodeMap[result.currentSessionId]) {
        nodeMap[result.currentSessionId] = { id: result.currentSessionId, children: [] };
      }
      if (!nodeMap[result.retriggeredFromSessionId]) {
        nodeMap[result.retriggeredFromSessionId] = { id: result.retriggeredFromSessionId, children: [] };
      }
      nodeMap[result.retriggeredFromSessionId].children.push(nodeMap[result.currentSessionId]);
      nodeMap[result.currentSessionId].callType = result.serviceKey;
    });

    // Determine the root ID: the root ID will not be present as a child in any of the relationships
    const childIds = new Set(this.incomingEvents.map(result => result.currentSessionId));
    const rootID = this.incomingEvents.find(result => !childIds.has(result.retriggeredFromSessionId))?.retriggeredFromSessionId;

    if (!rootID) {
      console.error('No root ID found');
      return;
    }

    this.treeData = nodeMap[rootID];
    this.sessionIDs = Object.keys(nodeMap);
    console.log('Tree Data:', this.treeData);
    console.log('Session IDs:', this.sessionIDs);
  }

  renderTree() {
    if (!this.treeData) {
      console.error('Tree data is not initialized');
      return;
    }

    const treeElement = document.getElementById('tree');
    if (treeElement) {
      d3.select(treeElement).selectAll('*').remove();

      const svg = d3.select(treeElement).append('svg').attr('width', 2000).attr('height', 250),
        g = svg.append('g').attr('transform', 'translate(140,40)');

      const tree = d3.tree<TreeNode>()
        .size([200, 1600])
        .separation((a, b) => 100); // Ensure even spacing

      const root = d3.hierarchy<TreeNode>(this.treeData);
      tree(root);

      const link = g.selectAll('.link')
        .data(root.links())
        .enter().append('line')
        .attr('class', 'link')
        .attr('x1', d => d.source.y!)
        .attr('y1', d => d.source.x!)
        .attr('x2', d => d.target.y!)
        .attr('y2', d => d.target.x!)
        .style('stroke', '#ccc');

      const node = g.selectAll('.node')
        .data(root.descendants())
        .enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);

      node.append('text')
        .attr('dy', '-1em') // Position above sessionID
        .attr('x', d => d.children ? -10 : 10)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.callType || '') // Use dictionary for callType
        .style('font-size', '14px');

      node.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children ? -10 : 10)
        .style('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.id)
        .style('font-size', '14px')
        .call((text: any) => {
          this.wrapText(text, 100);
        }); // Adjust the width as necessary
    }
  }

  wrapText = (text: any, width: number) => {
    text.each(function (this: SVGTextElement) {
      const textSelection = d3.select(this),
        words = textSelection.text().split(/\s+/).reverse(),
        lineHeight = 1.1, // ems
        x = textSelection.attr('x'),
        y = textSelection.attr('y'),
        dy = parseFloat(textSelection.attr('dy')) || 0;
      let tspan = textSelection.text(null).append('tspan').attr('x', x).attr('y', y).attr('dy', dy + 'em');
      let line: string[] = [],
        lineNumber = 0,
        word: string | undefined,
        tspanWidth: number;

      while (word = words.pop()) {
        line.push(word);
        tspan.text(line.join(' '));
        tspanWidth = tspan.node()?.getComputedTextLength() ?? 0;
        if (tspanWidth > width) { // Adjust the width as necessary
          line.pop();
          tspan.text(line.join(' '));
          line = [word];
          tspan = textSelection.append('tspan').attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
        }
      }
    });
  }
}
