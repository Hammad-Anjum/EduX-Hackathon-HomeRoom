import TranslateButton from './TranslateButton';

interface MessageBubbleProps {
  text: string;
  isMine: boolean;
  userLanguage: string;
}

export default function MessageBubble({ text, isMine, userLanguage }: MessageBubbleProps) {
  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-xs rounded-lg p-3 ${isMine ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
        <p className="text-sm">{text}</p>
        <TranslateButton
          text={text}
          targetLanguage={userLanguage}
          className={isMine ? 'text-indigo-200' : ''}
        />
      </div>
    </div>
  );
}
