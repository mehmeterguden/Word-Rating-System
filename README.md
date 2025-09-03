# Word Rating System

A modern, interactive vocabulary learning platform that helps you track and evaluate your word knowledge with an intelligent rating system.

[![React](https://img.shields.io/badge/React-18.0.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-blue.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

## 🌟 Features

### 📚 **Word Sets Management**
- Create multiple word sets for different topics or languages
- Organize vocabulary by categories (e.g., "Business English", "Daily Conversations")
- Edit set names and descriptions
- Delete unused sets

### 🌍 **Bilingual Support**
- Support for any language pair (default: English-Turkish)
- Custom separator character for word input
- Real-time preview of parsed words
- Flexible language selection from 200+ languages

### 🎯 **Interactive Evaluation System**
- Flashcard-style evaluation interface
- 1-5 difficulty rating system
- Keyboard shortcuts for quick rating (1-5 keys)
- Navigation between words (arrow keys, space)
- Progress tracking with visual indicators

### 📊 **Smart Progress Tracking**
- Visual difficulty indicators with color-coded badges
- Filter words by evaluation status (All/Pending)
- Export word sets to Excel (.xlsx) and plain text formats
- Reset individual word evaluations

### 🎨 **Modern UI/UX**
- Responsive design with Tailwind CSS
- Beautiful gradients and animations
- Intuitive navigation
- Mobile-friendly interface

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mehmeterguden/word-rating-system.git
   cd word-rating-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Usage Guide

### Creating Your First Word Set
1. Click on "Sets" in the navigation
2. Click "Create New Set"
3. Enter a name and description
4. Select your preferred languages and separator

### Adding Words
1. Go to "Add Words" page
2. Choose your word set
3. Enter words in format: `First Language - Second Language`
4. Use the preview to verify parsing
5. Click "Add Words"

### Evaluating Words
1. Navigate to "Evaluate" page
2. Choose evaluation options
3. Use keyboard shortcuts:
   - **1-5**: Rate difficulty
   - **Space/Click**: Reveal answer
   - **Arrow Keys**: Navigate
   - **ESC**: Close evaluation

### Managing Words
- **Home**: View all words with filtering options
- **Reset**: Clear individual word evaluations
- **Delete**: Remove words from your sets
- **Export**: Download word sets as Excel or text files

## 🛠️ Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Hooks
- **Data Storage**: Local Storage
- **Export**: XLSX.js for Excel files
- **Build Tool**: Create React App

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── EvaluationModal.tsx
│   ├── Header.tsx
│   ├── Navigation.tsx
│   ├── WordCard.tsx
│   └── WordsList.tsx
├── hooks/              # Custom React hooks
│   ├── useEvaluation.ts
│   ├── useWords.ts
│   └── useWordSets.ts
├── pages/              # Page components
│   ├── AddWords.tsx
│   ├── EvaluationOptions.tsx
│   ├── Home.tsx
│   └── WordSetManager.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
└── utils/              # Utility functions
    ├── difficultyUtils.ts
    └── languages.ts
```

## 🎯 Key Features Explained

### Word Sets System
The application uses a sophisticated word sets system that allows users to organize vocabulary by different categories, topics, or languages. Each set maintains its own language settings and word collection.

### Bilingual Word Structure
Words are stored with two text fields (`text1` and `text2`) representing the first and second languages. This enables flexible language pair support beyond just English-Turkish.

### Evaluation Algorithm
The system uses a 1-5 difficulty rating where:
- **1**: Very Easy
- **2**: Easy  
- **3**: Medium
- **4**: Hard
- **5**: Very Hard

### Data Persistence
All data is stored locally using browser's localStorage, ensuring privacy and offline functionality.

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject from Create React App
npm run eject
```

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Contact

- **GitHub**: [@mehmeterguden](https://github.com/mehmeterguden)
- **Project Link**: [https://github.com/mehmeterguden/word-rating-system](https://github.com/mehmeterguden/word-rating-system)

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- XLSX.js for Excel export functionality
- All contributors and users of this project

---

⭐ **Star this repository if you find it helpful!**
