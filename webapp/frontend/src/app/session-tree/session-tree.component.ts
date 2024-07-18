import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChildren, ElementRef, AfterViewInit, QueryList } from '@angular/core';
import * as d3 from 'd3';
import {NgForOf} from "@angular/common";
import { Router } from '@angular/router';


interface TreeNode {
  id: string;
  callType?: string;
  servedUser?: string;
  children: TreeNode[];
}

@Component({
  selector: 'app-session-tree',
  standalone: true,
  template: `
    <div *ngFor="let tree of treesData" class="tree-container">
      <div #treeContainer class="centered-tree"></div>
    </div>

  `,
  imports: [
    NgForOf
  ],
  styleUrls: ['./session-tree.component.css']
})
export class SessionTreeComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() callsList: any[] = [];
  @Input() sessions: any[] = [];
  @Input() call: any;
  @ViewChildren('treeContainer') treeContainers!: QueryList<ElementRef>;
  treesData: TreeNode[] = [];

  constructor(private router: Router) {}

  /* phoneNumberDictionary: { [key: string]: string } = {
    '4746180309': ' (A)',
    '4746180298': ' (B)',
    '4746180294': ' (C)',
    '4746180307': ' (D)',
    '4722390386': ' (E or Green Lantern)',
    '4746180245': ' (F)',
    '4722390380': ' (Super Man)',
    '4722390381': ' (Spider Man)',
    '4722390382': ' (Bat Man)',
    '4722390383': ' (The Flash)',
    '4722390384': ' (The Hulk)',
    '4722390385': ' (Captain America)',
    '4722390387': ' (He Man)',
    '4722390388': ' (Cat Woman)',
    '4722390389': ' (Wonder Woman)',

  };

  replacePhoneNumber(text: string): string {
    return text + this.phoneNumberDictionary[text] || text;
  }
  */

  ngOnInit() {
    if (this.callsList.length > 0 && this.sessions.length > 0) {
      this.buildTrees();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['callsList'] && this.callsList.length > 0) || (changes['sessions'] && this.sessions.length > 0)) {
      this.buildTrees();
    }
  }

  ngAfterViewInit() {
    this.renderTrees();
  }

  buildTrees() {
    if (!this.call || this.call.sessionIDs.length === 0) {
      console.error('No correlation results available to build the trees');
      return;
    }

    const nodeMap: { [key: string]: TreeNode } = {};
    const parentMap: { [key: string]: string[] } = {};

    // Build node map and parent-child relationships
    this.call.sessionIDs.forEach((sessionId: string) => {
      const session = this.sessions.find(s => s.sessionId === sessionId);
      if (session) {
        if (!nodeMap[session.sessionId]) {
          nodeMap[session.sessionId] = { id: session.sessionId, children: [] };
          nodeMap[session.sessionId].callType = session.serviceKey;
          nodeMap[session.sessionId].servedUser = session.servedUser;

        }
        session.children.forEach((childId: string) => {
          if (!nodeMap[childId]) {
            nodeMap[childId] = { id: childId, children: [] };
          }
          nodeMap[session.sessionId].children.push(nodeMap[childId]);
          nodeMap[childId].callType = this.sessions.find(s => s.sessionId === childId).serviceKey;
          nodeMap[childId].servedUser = this.sessions.find(s => s.sessionId === childId).servedUser;

          if (!parentMap[childId]) {
            parentMap[childId] = [];
          }
          parentMap[childId].push(session.sessionId);
        });
      }
    });

    // Identify all root IDs: nodes that are not children of any other node
    const allIds: Set<string> = new Set(this.call.sessionIDs);
    const childIds = new Set(Object.keys(parentMap));
    const rootIds: string[] = [...allIds].filter(id => !childIds.has(id)) as string[];

    this.treesData = rootIds.map(rootId => this.buildTreeFromRoot(rootId, nodeMap, new Set())).filter(tree => tree !== undefined) as TreeNode[];

    // Render trees after building them
    this.renderTrees();
  }

  buildTreeFromRoot(rootId: string, nodeMap: { [key: string]: TreeNode }, visited: Set<string>): TreeNode | undefined {
    if (visited.has(rootId)) {
      return undefined; // Detect circular logic and prevent infinite loops
    }
    visited.add(rootId);

    const rootNode = nodeMap[rootId];
    if (rootNode) {
      rootNode.children = rootNode.children.map(child => {
        return this.buildTreeFromRoot(child.id, nodeMap, new Set(visited));
      }).filter(child => child !== undefined) as TreeNode[];
      return rootNode;
    }
    return undefined;
  }

  renderTrees() {
    if (!this.treesData.length) {
      console.error('Trees data is not initialized');
      return;
    }

    if (!this.treeContainers || this.treeContainers.length === 0) {
      //console.error('No tree containers found');
      return;
    }

    this.treeContainers.forEach((treeContainer, index) => {
      const treeData = this.treesData[index];
      const totalNodes = this.countNodes(treeData);
      const maxDepth = this.getMaxDepth(treeData);
      const width = maxDepth * 300; // Dynamic width based on the depth of the tree
      const height = totalNodes * 60; // Dynamic height based on the number of nodes, increased for extra space
      console.log('Width:', width, 'Height:', height);

      const svg = d3.select(treeContainer.nativeElement).append('svg')
        .attr('width', width)
        .attr('height', height);

      const g = svg.append('g').attr('transform', `translate(140,40)`); // Adjust position for each tree

      const tree = d3.tree<TreeNode>()
        .size([height, width - 300]) // Adjust width here to accommodate the tree
        .separation((a, b) => 100); // Ensure even spacing

      const root = d3.hierarchy<TreeNode>(treeData);
      tree(root);

      const link = g.selectAll(`.link-${index}`)
        .data(root.links())
        .enter().append('line')
        .attr('class', `link link-${index}`)
        .attr('x1', d => d.source.y!)
        .attr('y1', d => d.source.x!)
        .attr('x2', d => d.target.y!)
        .attr('y2', d => d.target.x!)
        .style('stroke', '#ccc');

      const node = g.selectAll(`.node-${index}`)
        .data(root.descendants())
        .enter().append('g')
        .attr('class', `node node-${index}`)
        .attr('transform', d => `translate(${d.y},${d.x})`);

      node.append('circle')
      .attr('r', 5) // Initial radius
      .attr('class', d => this.getSessionSuccessColorClass(d.data.id))
      .style('cursor', 'pointer') // Change cursor to pointer on hover
      .on('click', (event, d) => this.onNodeClick(d.data.id)) // Add click event
      .on('mouseover', function(event, d) {
          d3.select(this).attr('r', 6.5); // Increase radius on hover
      })
      .on('mouseout', function(event, d) {
          d3.select(this).attr('r', 5); // Revert radius when not hovering
      });
    
    
      node.append('text')
        .attr('dy', '-2.5em') // Position above the circle with more space
        .attr('x', 0)
        .style('text-anchor', 'middle')
        .text(d => d.data.callType || '') // Use dictionary for callType
        .style('font-size', '14px');

      node.append('text')
        .attr('dy', '-4em') // Position above servedUser
        .attr('x', d => d.children ? -10 : 10)
        .text(d => (d.data.servedUser || '')) // Use dictionary for callType
        .style('text-anchor', 'middle')
        .style('font-size', '14px');

      node.append('text')
        .attr('dy', '-1em') // Position just above the circle
        .attr('x', 0)
        .style('text-anchor', 'middle')
        .text(d => d.data.id)
        .style('font-size', '14px')
        .style('fill', d => this.getSessionSuccessColor(d.data.id)) // Set color based on success
        .call((text: any) => {
          this.wrapText(text, 100);
        }); // Adjust the width as necessary
    });
  }

  getMaxDepth(node: TreeNode): number {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return 1 + Math.max(...node.children.map(child => this.getMaxDepth(child)));
  }



  getSessionSuccessColor(sessionId: string): string {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    return session && session.success ? 'green' : 'red';
  }

  getSessionSuccessColorClass(sessionId: string): string {
    const session = this.sessions.find(s => s.sessionId === sessionId);
    return session && session.success ? 'success' : 'failure';
  }

  countNodes(node: TreeNode): number {
    if (!node.children || node.children.length === 0) {
      return 1;
    }
    return 1 + node.children.reduce((acc, child) => acc + this.countNodes(child), 0);
  }

  onNodeClick(sessionId: string) {
    this.router.navigate(['/log-merge/1'], { queryParams: { sessionID: sessionId } });
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
