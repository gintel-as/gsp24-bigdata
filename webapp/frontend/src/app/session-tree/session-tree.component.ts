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
  @Input() callsList: any[] = [];
  @Input() sessions: any[] = [];
  @Input() call: any;
  treesData: TreeNode[] = [];

  ngOnInit() {
    if (this.callsList.length > 0 && this.sessions.length > 0) {
      this.buildTrees();
      this.renderTrees();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['callsList'] && this.callsList.length > 0) || (changes['sessions'] && this.sessions.length > 0)) {
      this.buildTrees();
      this.renderTrees();
    }
  }

  buildTrees() {
    if (!this.call || this.call.sessionIDs.length === 0) {
      console.error('No correlation results available to build the trees');
      return;
    }

    const nodeMap: { [key: string]: TreeNode } = {};
    const visited: { [key: string]: boolean } = {};

    this.call.sessionIDs.forEach((sessionId: string) => {
      const session = this.sessions.find(s => s.sessionId === sessionId);
      if (session) {
        if (!nodeMap[session.sessionId]) {
          nodeMap[session.sessionId] = { id: session.sessionId, children: [] };
        }
        session.children.forEach((childId: string) => {
          if (!visited[childId]) {
            if (!nodeMap[childId]) {
              nodeMap[childId] = { id: childId, children: [] };
            }
            nodeMap[session.sessionId].children.push(nodeMap[childId]);
            nodeMap[childId].callType = session.serviceKey;
          }
          visited[session.sessionId] = true;
        });
      }
    });

    // Identify all roots: nodes that are not children of any other node
    const allIds = new Set(this.call.sessionIDs);
    const childIds = new Set(this.call.sessionIDs.flatMap((sessionId: string) => nodeMap[sessionId]?.children.map(child => child.id) || []));
    const rootIds: string[] = [...allIds].filter(id => !childIds.has(id)) as string[];

    this.treesData = rootIds.map(rootId => nodeMap[rootId]).filter(tree => tree !== undefined) as TreeNode[];
    console.log('Trees Data:', this.treesData);
  }
  renderTrees() {
    if (!this.treesData.length) {
      console.error('Trees data is not initialized');
      return;
    }

    const treeElement = document.getElementById('tree');
    if (treeElement) {
      d3.select(treeElement).selectAll('*').remove();

      const svg = d3.select(treeElement).append('svg').attr('width', 2000).attr('height', 250 * this.treesData.length),
        g = svg.append('g').attr('transform', 'translate(140,40)');

      const tree = d3.tree<TreeNode>()
        .size([200, 1600])
        .separation((a, b) => 100); // Ensure even spacing

      this.treesData.forEach((treeData, index) => {
        const root = d3.hierarchy<TreeNode>(treeData);
        tree(root);

        const offsetY = index * 250;

        const link = g.selectAll(`.link-${index}`)
          .data(root.links())
          .enter().append('line')
          .attr('class', `link-${index}`)
          .attr('x1', d => d.source.y!)
          .attr('y1', d => (d.source.x ?? 0) + offsetY)
          .attr('x2', d => d.target.y!)
          .attr('y2', d => (d.target.x ?? 0) + offsetY)
          .style('stroke', '#ccc');

        const node = g.selectAll(`.node-${index}`)
          .data(root.descendants())
          .enter().append('g')
          .attr('class', `node-${index}`)
          .attr('transform', d => `translate(${d.y},${(d.x ?? 0) + offsetY})`);

        node.append('text')
          .attr('dy', '-1em') // Position above sessionID
          .attr('x', d => d.children ? -10 : 10)
          .style('text-anchor', 'middle')
          .text(d => d.data.callType || '') // Use dictionary for callType
          .style('font-size', '14px');

        node.append('text')
          .attr('dy', '.35em')
          .attr('x', d => d.children ? -10 : 10)
          .style('text-anchor', 'middle')
          .text(d => d.data.id)
          .style('font-size', '14px')
          .call((text: any) => {
            this.wrapText(text, 100);
          }); // Adjust the width as necessary
      });
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
