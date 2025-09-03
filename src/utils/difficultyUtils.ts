import { DifficultyLevel } from '../types';

export const getDifficultyColors = (difficulty: DifficultyLevel) => {
  switch (difficulty) {
    case 1:
      return {
        bg: 'bg-green-100',
        text: 'text-green-800',
        border: 'border-green-200',
        hover: 'hover:bg-green-200'
      };
    case 2:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        border: 'border-blue-200',
        hover: 'hover:bg-blue-200'
      };
    case 3:
      return {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        border: 'border-yellow-200',
        hover: 'hover:bg-yellow-200'
      };
    case 4:
      return {
        bg: 'bg-orange-100',
        text: 'text-orange-800',
        border: 'border-orange-200',
        hover: 'hover:bg-orange-200'
      };
    case 5:
      return {
        bg: 'bg-red-100',
        text: 'text-red-800',
        border: 'border-red-200',
        hover: 'hover:bg-red-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
        hover: 'hover:bg-gray-200'
      };
  }
};

export const getDifficultyLabel = (difficulty: DifficultyLevel): string => {
  switch (difficulty) {
    case 1:
      return 'Very Easy';
    case 2:
      return 'Easy';
    case 3:
      return 'Medium';
    case 4:
      return 'Hard';
    case 5:
      return 'Very Hard';
    default:
      return 'Not Rated';
  }
};
