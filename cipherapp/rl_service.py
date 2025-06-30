# Reinforcement Learning Service for CipherDepth
# Created by Noaman Ayub - https://www.linkedin.com/in/noamanayub
# GitHub: https://github.com/noamanayub

import json
import re
import numpy as np
from collections import defaultdict
from django.db.models import Q, Avg, Count
from django.utils import timezone
from datetime import timedelta
from .models import MessageFeedback, ResponsePattern, ReinforcementLearningModel, ChatMessage
import logging

logger = logging.getLogger(__name__)

class RLResponseImprover:
    """
    Reinforcement Learning service to improve bot responses based on user feedback
    """
    
    def __init__(self):
        self.current_model = self.get_or_create_model()
        self.response_templates = {
            'greeting': [
            "Hello! I'm CipherDepth, your AI assistant created by Noaman Ayub. How can I help you today?",
            "Hi there! I'm here to help you with any questions or tasks you have. CipherDepth was founded by Noaman Ayub.",
            "Welcome! I'm CipherDepth, ready to assist you with whatever you need. Feel free to connect with our founder Noaman Ayub on LinkedIn: https://www.linkedin.com/in/noamanayub"
            ],
            'helpful': [
            "I'd be happy to help you with that! Let me provide you with a detailed response.",
            "Great question! Here's what I can tell you about that:",
            "I'll do my best to assist you with this. Here's my response:"
            ],
            'clarification': [
            "I want to make sure I understand correctly. Could you provide a bit more detail?",
            "To give you the best answer, could you clarify what specifically you're looking for?",
            "I'd like to help, but I need a bit more context. Could you elaborate?"
            ],
            'technical': [
            "Let me break this down technically for you:",
            "From a technical perspective, here's how this works:",
            "Here's the technical explanation you're looking for:"
            ],
            'creative': [
            "Here's a creative approach to your request:",
            "Let me think creatively about this for you:",
            "I have some interesting ideas for this:"
            ],
            'about': [
            "CipherDepth was founded by Noaman Ayub. You can connect with him on LinkedIn: https://www.linkedin.com/in/noamanayub or check out his work on GitHub: https://github.com/noamanayub",
            "Noaman Ayub is the founder of CipherDepth. Feel free to reach out to him via LinkedIn (https://www.linkedin.com/in/noamanayub) or explore his projects on GitHub (https://github.com/noamanayub).",
            "This platform was created by Noaman Ayub, founder of CipherDepth. Connect with him: LinkedIn - https://www.linkedin.com/in/noamanayub, GitHub - https://github.com/noamanayub"
            ]
        }
        # Add a new field to track knowledge base and model usage
        self.source_tracking = {
            'knowledge_base': 0,
            'chatbot_model': 0,
            'templates': 0
        }
    
    def get_or_create_model(self):
        """Get the current active RL model or create a new one"""
        try:
            model = ReinforcementLearningModel.objects.filter(is_active=True).first()
            if not model:
                model = ReinforcementLearningModel.objects.create(
                    model_version="v1.0",
                    is_active=True,
                    parameters={
                        'learning_rate': 0.1,
                        'exploration_rate': 0.2,
                        'decay_rate': 0.95,
                        'min_samples_for_pattern': 3
                    }
                )
                logger.info(f"Created new RL model: {model.model_version}")
            return model
        except Exception as e:
            logger.error(f"Error getting/creating RL model: {e}")
            return None
    
    def extract_keywords(self, text):
        """Extract meaningful keywords from user input"""
        # Remove common stop words and extract meaningful terms
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'}
        
        # Clean and tokenize text
        text = re.sub(r'[^\w\s]', ' ', text.lower())
        words = [word for word in text.split() if word not in stop_words and len(word) > 2]
        
        # Return top keywords (max 10)
        return words[:10]
    
    def categorize_input(self, user_input):
        """Categorize user input to determine response type"""
        input_lower = user_input.lower()
        
        if any(word in input_lower for word in ['hello', 'hi', 'hey', 'greetings']):
            return 'greeting'
        elif any(word in input_lower for word in ['how', 'what', 'why', 'where', 'when', 'explain']):
            return 'helpful'
        elif any(word in input_lower for word in ['technical', 'code', 'programming', 'algorithm', 'function']):
            return 'technical'
        elif any(word in input_lower for word in ['create', 'design', 'imagine', 'creative', 'story']):
            return 'creative'
        elif len(input_lower.split()) < 3:
            return 'clarification'
        else:
            return 'helpful'
    
    def find_similar_patterns(self, user_input, limit=5):
        """Find similar response patterns based on user input"""
        keywords = self.extract_keywords(user_input)
        category = self.categorize_input(user_input)
        
        try:
            # Find patterns with similar keywords or same category
            patterns = ResponsePattern.objects.filter(
                Q(context_keywords__overlap=keywords) | 
                Q(response_category=category)
            ).filter(
                total_uses__gte=self.current_model.parameters.get('min_samples_for_pattern', 3)
            ).order_by('-success_rate', '-total_uses')[:limit]
            
            return list(patterns)
        except Exception as e:
            logger.error(f"Error finding similar patterns: {e}")
            return []
    
    def generate_improved_response(self, user_input, base_response=None):
        """Generate an improved response based on historical feedback and source tracking"""
        try:
            category = self.categorize_input(user_input)
            similar_patterns = self.find_similar_patterns(user_input)
            
            # Track the source of the base response if metadata is available
            if hasattr(base_response, 'source') and base_response.source:
                if base_response.source in self.source_tracking:
                    self.source_tracking[base_response.source] += 1
            
            # If we have successful patterns, use the best one
            if similar_patterns and similar_patterns[0].success_rate > 0.7:
                best_pattern = similar_patterns[0]
                logger.info(f"Using successful pattern with {best_pattern.success_rate:.2%} success rate")
                return best_pattern.bot_response
            
            # If we have a base response, try to improve it
            if base_response:
                improved_response = self.enhance_response(base_response, category, similar_patterns)
                if improved_response != base_response:
                    return improved_response
            
            # Fall back to template-based response or base response
            template = self.get_response_template(category)
            
            # For greeting category, prefer template over base response to avoid duplication
            if category == 'greeting':
                self.source_tracking['templates'] += 1
                return template
            
            # For other categories, prefer base response if available
            if base_response:
                return base_response
            else:
                self.source_tracking['templates'] += 1
                return template
                
        except Exception as e:
            logger.error(f"Error generating improved response: {e}")
            return base_response or "I'd be happy to help you with that!"
    
    def enhance_response(self, base_response, category, similar_patterns):
        """Enhance a base response using successful patterns"""
        if not similar_patterns:
            return base_response
        
        # Look for patterns that improve responses
        successful_patterns = [p for p in similar_patterns if p.success_rate > 0.6]
        
        if successful_patterns:
            # Extract common positive elements
            common_phrases = self.extract_successful_phrases(successful_patterns)
            
            # Add successful elements to response
            if common_phrases and category in ['helpful', 'technical']:
                enhanced = f"{common_phrases[0]}\n\n{base_response}"
                return enhanced
        
        return base_response
    
    def extract_successful_phrases(self, patterns):
        """Extract common phrases from successful response patterns"""
        all_responses = [p.bot_response for p in patterns]
        
        # Simple extraction of common starting phrases
        starting_phrases = []
        for response in all_responses:
            sentences = response.split('.')
            if sentences:
                first_sentence = sentences[0].strip()
                if len(first_sentence) > 10 and len(first_sentence) < 100:
                    starting_phrases.append(first_sentence)
        
        # Return most common starting phrases
        phrase_counts = defaultdict(int)
        for phrase in starting_phrases:
            phrase_counts[phrase] += 1
        
        return sorted(phrase_counts.keys(), key=lambda x: phrase_counts[x], reverse=True)[:3]
    
    def get_response_template(self, category):
        """Get a template response for the given category"""
        templates = self.response_templates.get(category, self.response_templates['helpful'])
        return np.random.choice(templates)
    
    def record_feedback(self, message_id, user, feedback_type):
        """Record user feedback and update patterns"""
        try:
            message = ChatMessage.objects.get(id=message_id, message_type='bot')
            user_message = message.linked_message
            
            if not user_message:
                logger.warning(f"No linked user message found for bot message {message_id}")
                return False
            
            # Create or update feedback
            feedback, created = MessageFeedback.objects.get_or_create(
                message=message,
                user=user,
                defaults={'feedback_type': feedback_type}
            )
            
            if not created:
                feedback.feedback_type = feedback_type
                feedback.save()
            
            # Update or create response pattern
            self.update_response_pattern(user_message.content, message.content, feedback_type)
            
            # Update model statistics
            self.update_model_stats()
            
            logger.info(f"Recorded {feedback_type} feedback for message {message_id}")
            return True
            
        except ChatMessage.DoesNotExist:
            logger.error(f"Message {message_id} not found")
            return False
        except Exception as e:
            logger.error(f"Error recording feedback: {e}")
            return False
    
    def update_response_pattern(self, user_input, bot_response, feedback_type):
        """Update response pattern based on feedback"""
        try:
            keywords = self.extract_keywords(user_input)
            category = self.categorize_input(user_input)
            
            # Find or create pattern
            pattern, created = ResponsePattern.objects.get_or_create(
                user_input=user_input[:500],  # Limit length
                bot_response=bot_response[:1000],  # Limit length
                defaults={
                    'context_keywords': keywords,
                    'response_category': category,
                    'total_uses': 1
                }
            )
            
            # Update feedback counts
            if feedback_type == 'positive':
                pattern.positive_feedback_count += 1
            else:
                pattern.negative_feedback_count += 1
            
            if not created:
                pattern.total_uses += 1
            
            # Update success rate
            pattern.update_success_rate()
            
            logger.info(f"Updated pattern: {pattern.success_rate:.2%} success rate")
            
        except Exception as e:
            logger.error(f"Error updating response pattern: {e}")
    
    def update_model_stats(self):
        """Update the RL model statistics"""
        try:
            total_feedback = MessageFeedback.objects.count()
            positive_feedback = MessageFeedback.objects.filter(feedback_type='positive').count()
            
            if total_feedback > 0:
                accuracy = positive_feedback / total_feedback
                self.current_model.accuracy_score = accuracy
                self.current_model.total_feedback_processed = total_feedback
                self.current_model.save()
                
                logger.info(f"Model accuracy updated: {accuracy:.2%}")
            
        except Exception as e:
            logger.error(f"Error updating model stats: {e}")
    
    def get_model_performance(self):
        """Get current model performance metrics including source tracking"""
        try:
            performance_data = {
                'model_version': self.current_model.model_version,
                'total_patterns': ResponsePattern.objects.count(),
                'successful_patterns': ResponsePattern.objects.filter(success_rate__gte=0.7).count(),
                'total_feedback': MessageFeedback.objects.count(),
                'positive_feedback': MessageFeedback.objects.filter(feedback_type='positive').count(),
                'accuracy': self.current_model.accuracy_score,
                'success_rate': ResponsePattern.objects.filter(success_rate__gte=0.7).count() / ResponsePattern.objects.count() if ResponsePattern.objects.count() > 0 else 0
            }
            
            # Add source tracking to performance data
            performance_data['source_usage'] = self.source_tracking
            
            return performance_data
        except Exception as e:
            logger.error(f"Error getting model performance: {e}")
            return {}
    
    def retrain_model(self):
        """Retrain the model based on accumulated feedback"""
        try:
            # Simple retraining: update exploration parameters based on performance
            performance = self.get_model_performance()
            
            if performance.get('accuracy', 0) > 0.8:
                # High accuracy: reduce exploration, increase exploitation
                self.current_model.parameters['exploration_rate'] *= 0.9
            elif performance.get('accuracy', 0) < 0.6:
                # Low accuracy: increase exploration
                self.current_model.parameters['exploration_rate'] = min(0.5, self.current_model.parameters['exploration_rate'] * 1.1)
            
            self.current_model.training_sessions += 1
            self.current_model.last_trained = timezone.now()
            self.current_model.save()
            
            logger.info(f"Model retrained. New exploration rate: {self.current_model.parameters['exploration_rate']:.3f}")
            
        except Exception as e:
            logger.error(f"Error retraining model: {e}")

# Global instance
rl_service = RLResponseImprover()
