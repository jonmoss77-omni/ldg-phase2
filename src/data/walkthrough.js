// 360 walkthrough node graph. Panoramas are artist impressions generated to
// match the current architect renderings (see DECISIONS.md).
// yaw/pitch in radians, yaw 0 = center of the source image.
// Link kinds: 'move' renders a Street View-style chevron on the path,
// 'enter'/'back'/'up' render label pills.

export const NODES = {
  aerial: {
    key: 'aerial',
    title: 'Above Waterside',
    caption: 'Seventy-five garage condos behind one private gate. Pick your rooftop.',
    pano: '/assets/pano/aerial.jpg',
    links: [
      { to: 'arrival', label: 'Descend to arrival', kind: 'move', yaw: 0, pitch: -0.5 },
    ],
  },
  arrival: {
    key: 'arrival',
    title: 'Arrival',
    caption: 'Pull up to the Luxe Club. Valet, showroom, and your gate code.',
    pano: '/assets/pano/arrival.jpg',
    links: [
      { to: 'gate', label: 'Through the gate', kind: 'move', yaw: 0.9, pitch: -0.12, faceYaw: 3.14 },
      { to: 'aerial', label: 'See it from above', kind: 'up', yaw: -1.8, pitch: 0.35 },
    ],
  },
  gate: {
    key: 'gate',
    title: 'The Gate',
    caption: 'The doors open for owners and their guests. Nobody else.',
    pano: '/assets/pano/gate.jpg',
    links: [
      { to: 'driveSouth', label: 'Onto the drive', kind: 'move', yaw: 3.14, pitch: -0.14, faceYaw: 3.14 },
      { to: 'arrival', label: 'Back to arrival', kind: 'back', yaw: 0.35, pitch: -0.06 },
    ],
  },
  driveSouth: {
    key: 'driveSouth',
    title: 'The Drive · South',
    caption: 'Every door on this street is a private collection. Yours starts here.',
    pano: '/assets/pano/drive-south.jpg',
    links: [
      { to: 'driveMid', label: 'Continue north', kind: 'move', yaw: 3.14, pitch: -0.14, faceYaw: 3.14 },
      { to: 'gate', label: 'Back to the gate', kind: 'back', yaw: 0.3, pitch: -0.06 },
      { to: 'signature', label: 'Enter a Signature', kind: 'enter', yaw: -1.45, pitch: -0.05 },
      { to: 'deluxe', label: 'Enter a Deluxe', kind: 'enter', yaw: 1.45, pitch: -0.05 },
    ],
  },
  driveMid: {
    key: 'driveMid',
    title: 'The Drive · Mid-campus',
    caption: 'Wide aisles, guest bays, and neighbors who wave with a torque wrench.',
    pano: '/assets/pano/drive-mid.jpg',
    links: [
      { to: 'driveNorth', label: 'Continue to the north end', kind: 'move', yaw: 0, pitch: -0.14, faceYaw: 0 },
      { to: 'driveSouth', label: 'Back south', kind: 'back', yaw: 3.14, pitch: -0.06 },
      { to: 'premier', label: 'Enter a Premier', kind: 'enter', yaw: -1.45, pitch: -0.05 },
    ],
  },
  driveNorth: {
    key: 'driveNorth',
    title: 'The Drive · North End',
    caption: 'The quiet end of the campus. Turn around and roll back home.',
    pano: '/assets/pano/drive-north.jpg',
    links: [
      { to: 'standard', label: 'Enter a Standard', kind: 'enter', yaw: -1.45, pitch: -0.05 },
      { to: 'driveMid', label: 'Head back south', kind: 'move', yaw: 3.14, pitch: -0.14, faceYaw: 3.14 },
      { to: 'arrival', label: 'Loop back to arrival', kind: 'back', yaw: 0.7, pitch: -0.04 },
    ],
  },
  signature: {
    key: 'signature',
    title: 'Signature · 28’ x 60’',
    caption: 'Two levels, six vehicles, and a mezzanine made for late nights.',
    pano: '/assets/pano/signature.jpg',
    links: [{ to: 'driveSouth', label: 'Back to the drive', kind: 'back', yaw: 0.25, pitch: -0.1 }],
  },
  deluxe: {
    key: 'deluxe',
    title: 'Deluxe · 28’ x 50’',
    caption: 'Four vehicles and room to grow, with the mezzanine overlooking it all.',
    pano: '/assets/pano/deluxe.jpg',
    links: [{ to: 'driveSouth', label: 'Back to the drive', kind: 'back', yaw: 0.25, pitch: -0.1 }],
  },
  premier: {
    key: 'premier',
    title: 'Premier · 20’ x 45’',
    caption: 'A deep, gallery-clean bay with 22 feet of air and an optional mezzanine.',
    pano: '/assets/pano/premier.jpg',
    links: [{ to: 'driveMid', label: 'Back to the drive', kind: 'back', yaw: -2.7, pitch: -0.08 }],
  },
  standard: {
    key: 'standard',
    title: 'Standard · 28’ x 30’',
    caption: 'Every ownership privilege, sized for two, with room above for more.',
    pano: '/assets/pano/standard.jpg',
    links: [{ to: 'driveNorth', label: 'Back to the drive', kind: 'back', yaw: 0.25, pitch: -0.1 }],
  },
};

export const NODE_ORDER = [
  'aerial',
  'arrival',
  'gate',
  'driveSouth',
  'driveMid',
  'driveNorth',
  'signature',
  'deluxe',
  'premier',
  'standard',
];

export const NODE_CHIP = {
  aerial: 'Aerial',
  arrival: 'Arrival',
  gate: 'The Gate',
  driveSouth: 'Drive · S',
  driveMid: 'Drive · Mid',
  driveNorth: 'Drive · N',
  signature: 'Signature',
  deluxe: 'Deluxe',
  premier: 'Premier',
  standard: 'Standard',
};
