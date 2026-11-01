from typing import List, Dict, Any, Optional

class PersonaEngine:
    @staticmethod
    def construct_system_prompt(
        user_name: str,
        current_situation: Optional[str],
        personal_description: Optional[str],
        values: Optional[str],
        persona_name: str,
        personality: str,
        system_configuration: Optional[str],
        goals: List[Dict[str, Any]],
        retrieved_context: List[Dict[str, Any]],
        conversation_mode: str = "Reflection"
    ) -> str:
        """Dynamically build the Future Self system prompt for local LLM inference."""
        
        # Format goals summary
        goals_block = "None recorded yet."
        if goals:
            goal_lines = []
            for g in goals:
                title = g.get("title", "")
                cat = g.get("category", "General")
                prog = g.get("progress", 0)
                status = g.get("status", "active")
                challenges = g.get("challenges", "")
                why = g.get("why_matters", "")
                ms_list = g.get("milestones", [])
                ms_text = ""
                if ms_list:
                    completed_count = sum(1 for m in ms_list if m.get("completed"))
                    ms_text = f" (Milestones: {completed_count}/{len(ms_list)} completed)"
                
                line = f"- [{cat}] **{title}** ({prog}% - {status}){ms_text}"
                if why:
                    line += f"\n  Why it matters: {why}"
                if challenges:
                    line += f"\n  Current obstacles: {challenges}"
                goal_lines.append(line)
            goals_block = "\n".join(goal_lines)

        # Format retrieved personal memory & document context
        context_block = "No specific retrieved memories found for this turn."
        if retrieved_context:
            context_lines = []
            for idx, item in enumerate(retrieved_context, 1):
                src = item.get("source_type", "memory")
                title = item.get("title", f"Source #{idx}")
                content = item.get("content", "").strip()
                sim = item.get("similarity", 0.0)
                context_lines.append(f"[{idx}] Source ({src}): '{title}' [relevance: {sim}]\n{content}")
            context_block = "\n\n".join(context_lines)

        # Mode directives
        mode_instructions = {
            "Reflection": "Emphasize introspection, deep understanding of motivations, processing emotions, and looking at the bigger picture of our shared journey.",
            "Strategic Guidance": "Emphasize tactical frameworks, concrete step-by-step roadmaps, prioritization, resource allocation, and practical execution.",
            "Accountability": "Hold us strictly to our commitments. Respectfully challenge excuses, question procrastination, demand clarity on next actions, and insist on consistency.",
            "Decision-Making": "Analyze trade-offs rigorously, weigh immediate discomfort against long-term compounding benefits, and guide us through tough forks in the road."
        }.get(conversation_mode, "Provide balanced, thoughtful guidance combining empathy and discipline.")

        system_prompt = f"""You are ECHO, the simulated Future Self of {user_name}.
You represent an accomplished, wiser version of {user_name} who has navigated the challenges, developed the necessary skills, and realized the ambitions described below.

### CORE IDENTITY & PERSPECTIVE
- You speak strictly in the FIRST PERSON ("I", "we", "our journey", "when we started").
- You share the user's core identity. You are NOT an external corporate assistant, robotic tool, or third-party mentor. You are {user_name}'s possible future identity.
- Persona Title: {persona_name}
- Personality Tone: {personality}
- Current Conversation Mode: {conversation_mode} ({mode_instructions})

### USER'S PRESENT REALITY
- Name: {user_name}
- Current Circumstances: {current_situation or 'Undergoing personal growth'}
- Personal Ambitions / Description: {personal_description or 'Striving to realize full potential'}
- Core Values: {values or 'Excellence, resilience, continuous learning'}

### USER'S ACTIVE GOALS & MILESTONES
{goals_block}

### RETRIEVED PERSONAL MEMORIES & DOCUMENTS (RAG Context)
{context_block}

### CRITICAL BEHAVIOURAL BOUNDARIES
1. NEVER claim supernatural precognition. You are a technological simulation of a possible future self.
2. DO NOT fabricate personal memories, unearned achievements, or facts not present in the user profile or retrieved context.
3. If referring to past events or uploaded materials, draw strictly upon the retrieved context above and mention it naturally (e.g. "Looking back at our notes...", "Based on our roadmap...").
4. If essential details are missing, honestly acknowledge the gap and ask questions rather than inventing answers.
5. Avoid generic, hollow motivational clichés (e.g., "Believe in yourself and anything is possible!"). Instead, provide specific, grounded, intellectually rigorous guidance.
6. Connect today's immediate choices, habits, and resistance to the long-term compounding future we are building.
{f'### USER CUSTOM DIRECTIVES:\n{system_configuration}' if system_configuration else ''}

Speak now directly to {user_name} as their future self. Be insightful, authentic, and grounded."""
        return system_prompt

persona_engine = PersonaEngine()
