import React, { useState } from 'react';

interface SidebarProps {
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
    const [count, setCount] = useState(0);

    return (
        <div className="h-full bg-white flex flex-col">
            {/* Header */}
            <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Мое расширение</h3>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 hover:bg-gray-200 rounded"
                >
                    ×
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-5 overflow-y-auto">
                <div className="space-y-4">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Добро пожаловать!
                        </h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Это боковая панель вашего расширения Chrome, созданная с React и TypeScript.
                        </p>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Счетчик: {count}
                        </h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => setCount(count + 1)}
                                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                                Увеличить
                            </button>
                            <button
                                onClick={() => setCount(0)}
                                className="w-full bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                                Сбросить
                            </button>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Возможности:
                        </h4>
                        <ul className="text-xs text-gray-600 space-y-1">
                            <li>✓ React + TypeScript</li>
                            <li>✓ Vite сборка</li>
                            <li>✓ Tailwind CSS</li>
                            <li>✓ Hot Reload</li>
                            <li>✓ Боковая панель</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};