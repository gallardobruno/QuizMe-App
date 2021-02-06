const { gql } = require('apollo-server');

module.exports = gql`
	type QuizzesByCategory {
		id: String
		description_en: String
		description_es: String
		value: Int
	}

	extend type Query {
		getTotalQuiz: Int
		getNewUsers: Int
		getQuizzesByCategories: [QuizzesByCategory]
	}
`;
