
import React from 'react';

const Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} {...props}>
        {props.children}
    </svg>
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></Icon>;
export const FilterIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></Icon>;
export const CheckCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon className="h-4 w-4 text-success" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
export const XCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon className="h-4 w-4 text-danger" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
export const ImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>;
export const VideoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></Icon>;
export const LinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></Icon>;
export const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
export const AssignUserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></Icon>;
export const DuplicateIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></Icon>;
export const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></Icon>;
export const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></Icon>;
export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon className="text-accent h-6 w-6" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6.343 6.343l2.829 2.829m-2.83-2.829l2.829-2.829M11 3v4M9 5h4M17.657 6.343l-2.829 2.829m2.83-2.829l-2.829-2.829M19 3v4M17 5h4M14.657 14.657l2.829 2.829m-2.83-2.829l2.829-2.829M5 19v4M3 21h4M17.657 17.657l-2.829 2.829m2.83-2.829l-2.829-2.829M19 19v4M17 21h4M11 19v4M9 21h4" /></Icon>;
export const TrashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon className="h-4 w-4" {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></Icon>;
export const CalendarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></Icon>;
export const ClipboardCheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></Icon>;
export const StarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></Icon>;


// Icons for the new Dashboard
export const DashboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></Icon>;
export const UsersIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.197-5.975M15 21H3v-1a6 6 0 0112 0v1z" /></Icon>;
export const BriefcaseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></Icon>;

// Icons for Image Editor
export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></Icon>;
export const ArrowUpRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" /></Icon>;
export const TypeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7V4h16v3M9 20h6M12 4v16" /></Icon>;
export const UndoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l4-4m-4 4 4 4" /></Icon>;
export const RedoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10H11a8 8 0 00-8 8v2m8-10 4-4m-4 4 4 4" /></Icon>;

// Zoom Icons
export const ZoomInIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></Icon>;
export const ZoomOutIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" /></Icon>;
export const RefreshIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></Icon>;

// New Icons for QuizTaker Navigation
export const MenuIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></Icon>;
export const ChevronLeftIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></Icon>;
export const ChevronRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => <Icon {...props}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></Icon>;
