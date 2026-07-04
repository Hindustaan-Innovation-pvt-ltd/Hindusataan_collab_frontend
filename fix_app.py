import sys
import re

with open('src/app/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the entire import section up to `// ── App ──`
imports = """import { useState, useRef, useEffect, useCallback } from "react";
import { Sparkles, X, MessageSquare } from "lucide-react";
import { toPng } from "html-to-image";

import type { Tool, ShapeKind, Pt, ShapeEl, PenType, PenThickness, PathEl, ConnectionEl, FreeArrowEl, El, Cam, Board, Peer, Comment } from "../types";
import { STICKY_COLORS, SHAPE_COLORS, PEN_COLORS, TOOLS, SHAPE_KINDS, INIT_ELS } from "../constants";
import { uid, worldPt, pathD, getElementBox, getBoundaryPt } from "../utils";

import StickyNote from "../components/StickyNote";
import TextNode from "../components/TextNode";
import ShapeNode from "../components/ShapeNode";
import TableNode from "../components/TableNode";
import AIDialog from "../components/AIDialog";
import Toolbar from "../components/Toolbar";
import TopBar from "../components/TopBar";
import ContextMenu from "../components/ContextMenu";

// ── App ───────────────────────────────────────────────────────────────────────
"""

# Find where `// ── App ──` starts
app_idx = content.find('// ── App ──')

# Find the end of INIT_ELS local declaration
# It looks like:
# const INIT_ELS: El[] = [
#   ...
# ];
init_els_end = content.find('];', app_idx) + 2

# We replace everything from the beginning to the end of INIT_ELS with our new imports
# Wait, I should make sure I find the actual INIT_ELS block
init_els_start = content.find('const INIT_ELS', app_idx)
if init_els_start != -1:
    content = imports + "\n" + content[init_els_end:]
else:
    content = imports + "\n" + content[app_idx + len('// ── App ───────────────────────────────────────────────────────────────────────\n'):]

# Also remove unused component imports (ConnectionNodes, CellEditor, ColorPalette) if they are in the file
# Oh wait, my `imports` string above already omits them! That's perfect.

with open('src/app/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed App.tsx")
