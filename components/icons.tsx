import React from 'react';

type IconProps = {
  className?: string;
  style?: React.CSSProperties;
};

export const MicIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm0 12a5 5 0 0 1-5-5V5a5 5 0 0 1 10 0v6a5 5 0 0 1-5 5z" />
    <path d="M19 10v1a7 7 0 0 1-14 0v-1h2v1a5 5 0 0 0 10 0v-1h2z" />
    <path d="M12 19a1 1 0 0 1-1-1v-3a1 1 0 1 1 2 0v3a1 1 0 0 1-1-1z" />
  </svg>
);

export const StopIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

export const BrainIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9.5 4c1.8 0 3.4.8 4.5 2.1 1.1-1.3 2.7-2.1 4.5-2.1 3.3 0 6 2.7 6 6 0 1.9-.9 3.6-2.3 4.7l-1.3.9c-.3.2-.5.5-.5.9v1.2c0 .4-.2.8-.5 1-.3.2-.7.3-1.1.2-1.3-.4-2.7-.6-4.1-.6s-2.8.2-4.1.6c-.3.1-.7 0-1.1-.2-.3-.2-.5-.6-.5-1v-1.2c0-.4-.2-.7-.5-.9l-1.3-.9C3.4 13.6 2.5 11.9 2.5 10c0-3.3 2.7-6 6-6zm.5 14h4c.3 0 .5.2.5.5v1c0 .3-.2.5-.5.5h-4c-.3 0-.5-.2-.5-.5v-1c0-.3.2-.5.5-.5zM6 10c0 1.8.9 3.4 2.4 4.3l.6.4v1.8c.4-.1.8-.2 1.3-.2h5.4c.5 0 .9.1 1.3.2V14.7l.6-.4C17.1 13.4 18 11.8 18 10c0-2.2-1.8-4-4-4-1.6 0-3 1-3.7 2.4-.2.4-.6.6-1.1.6s-.9-.2-1.1-.6C7.5 7 6 8.4 6 10z" />
  </svg>
);

export const SpeakerIcon: React.FC<IconProps> = ({ className, style }) => (
  <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"></path>
  </svg>
);

export const TrainingIcon: React.FC<IconProps> = ({ className, style }) => (
    <svg className={className} style={style} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
);
