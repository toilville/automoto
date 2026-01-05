"""Project data models for knowledge artifact management.

Defines the core domain models representing projects and their associated
knowledge artifacts (papers, talks, repositories), along with execution
configuration and quality metrics.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional
from enum import Enum
import json


class SourceType(str, Enum):
    """Types of knowledge sources."""
    PAPER = "paper"
    TALK = "talk"
    REPOSITORY = "repository"


class ResearchMaturityStage(str, Enum):
    """Research maturity progression stages."""
    EXPLORATORY = "exploratory"  # Early-stage research
    VALIDATED = "validated"  # Research validated with evidence
    DEPLOYED = "deployed"  # Research in production use


@dataclass
class PaperReference:
    """Reference to an academic paper source.
    
    Attributes:
        id: Unique identifier for this paper reference
        title: Paper title
        authors: List of author names
        publication_venue: Conference, journal, or workshop name
        publication_year: Year of publication
        doi_or_url: DOI or URL for accessing the paper
        abstract: Short abstract of the paper
    """
    id: str
    title: str
    authors: list[str]
    publication_venue: str
    publication_year: int
    doi_or_url: str
    abstract: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "authors": self.authors,
            "publication_venue": self.publication_venue,
            "publication_year": self.publication_year,
            "doi_or_url": self.doi_or_url,
            "abstract": self.abstract,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "PaperReference":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            title=data["title"],
            authors=data["authors"],
            publication_venue=data["publication_venue"],
            publication_year=data["publication_year"],
            doi_or_url=data["doi_or_url"],
            abstract=data.get("abstract"),
        )


@dataclass
class TalkReference:
    """Reference to a talk/presentation source.
    
    Attributes:
        id: Unique identifier for this talk reference
        title: Talk title
        speaker: Primary speaker name
        event_name: Conference, meetup, or event name
        event_date: Date of the event
        video_url: URL to the talk video (if available)
        slides_url: URL to slides (if available)
        summary: Summary of key points from the talk
    """
    id: str
    title: str
    speaker: str
    event_name: str
    event_date: str  # ISO format date
    video_url: Optional[str] = None
    slides_url: Optional[str] = None
    summary: Optional[str] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "title": self.title,
            "speaker": self.speaker,
            "event_name": self.event_name,
            "event_date": self.event_date,
            "video_url": self.video_url,
            "slides_url": self.slides_url,
            "summary": self.summary,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "TalkReference":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            title=data["title"],
            speaker=data["speaker"],
            event_name=data["event_name"],
            event_date=data["event_date"],
            video_url=data.get("video_url"),
            slides_url=data.get("slides_url"),
            summary=data.get("summary"),
        )


@dataclass
class RepositoryReference:
    """Reference to a code repository source.
    
    Attributes:
        id: Unique identifier for this repository reference
        name: Repository name
        url: Repository URL (GitHub, GitLab, etc.)
        language: Primary programming language
        description: Repository description
        stars: GitHub stars (if available)
        last_updated: Last commit date
    """
    id: str
    name: str
    url: str
    language: str
    description: Optional[str] = None
    stars: Optional[int] = None
    last_updated: Optional[str] = None  # ISO format date
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "url": self.url,
            "language": self.language,
            "description": self.description,
            "stars": self.stars,
            "last_updated": self.last_updated,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "RepositoryReference":
        """Create from dictionary."""
        return cls(
            id=data["id"],
            name=data["name"],
            url=data["url"],
            language=data["language"],
            description=data.get("description"),
            stars=data.get("stars"),
            last_updated=data.get("last_updated"),
        )


@dataclass
class ExecutionConfig:
    """Configuration for how agents execute on a project.
    
    Attributes:
        extraction_agent_type: Type of agent to use for extraction ("paper", "talk", "repository")
        max_iterations: Maximum number of refinement iterations
        quality_threshold: Minimum confidence score (1-5) required to pass review
        parallelization: Whether to process artifacts in parallel
        timeout_seconds: Timeout for agent execution per artifact
    """
    extraction_agent_type: str = "paper"
    max_iterations: int = 2
    quality_threshold: float = 3.0
    parallelization: bool = True
    timeout_seconds: int = 300
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "extraction_agent_type": self.extraction_agent_type,
            "max_iterations": self.max_iterations,
            "quality_threshold": self.quality_threshold,
            "parallelization": self.parallelization,
            "timeout_seconds": self.timeout_seconds,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "ExecutionConfig":
        """Create from dictionary."""
        return cls(
            extraction_agent_type=data.get("extraction_agent_type", "paper"),
            max_iterations=data.get("max_iterations", 2),
            quality_threshold=data.get("quality_threshold", 3.0),
            parallelization=data.get("parallelization", True),
            timeout_seconds=data.get("timeout_seconds", 300),
        )


@dataclass
class QualityMetrics:
    """Quality metrics aggregated across all artifacts in a project.
    
    Attributes:
        total_artifacts: Total number of artifacts (papers + talks + repositories)
        artifacts_reviewed: Number of artifacts completed review
        average_confidence: Average confidence score across all artifacts
        average_coverage: Average coverage percentage across artifacts
        last_updated: When metrics were last calculated
    """
    total_artifacts: int = 0
    artifacts_reviewed: int = 0
    average_confidence: float = 0.0
    average_coverage: float = 0.0
    last_updated: Optional[datetime] = None
    
    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "total_artifacts": self.total_artifacts,
            "artifacts_reviewed": self.artifacts_reviewed,
            "average_confidence": self.average_confidence,
            "average_coverage": self.average_coverage,
            "last_updated": self.last_updated.isoformat() if self.last_updated else None,
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "QualityMetrics":
        """Create from dictionary."""
        last_updated = None
        if data.get("last_updated"):
            last_updated = datetime.fromisoformat(data["last_updated"])
        
        return cls(
            total_artifacts=data.get("total_artifacts", 0),
            artifacts_reviewed=data.get("artifacts_reviewed", 0),
            average_confidence=data.get("average_confidence", 0.0),
            average_coverage=data.get("average_coverage", 0.0),
            last_updated=last_updated,
        )


@dataclass
class ProjectDefinition:
    """Complete project definition for knowledge artifact collection and compilation.
    
    Represents a research project that collects knowledge from multiple sources
    (papers, talks, repositories) and compiles them into a unified knowledge graph.
    
    Attributes:
        id: Unique project identifier
        name: Human-readable project name
        description: Detailed description of the project
        research_area: Domain or research area (e.g., "distributed systems", "machine learning")
        papers: List of paper references to extract from
        talks: List of talk references to extract from
        repositories: List of repository references to extract from
        objectives: Key objectives for the project
        keywords: Searchable keywords associated with the project
        maturity_stage: Current research maturity stage
        created_at: Project creation timestamp
        updated_at: Last modification timestamp
        status: Current project status ("created", "active", "compiled", etc.)
        execution_config: Configuration for agent execution
        compiled_knowledge: Compiled knowledge graph (if completed)
        quality_metrics: Aggregated quality metrics
    """
    id: str
    name: str
    description: str
    research_area: str
    papers: list[PaperReference] = field(default_factory=list)
    talks: list[TalkReference] = field(default_factory=list)
    repositories: list[RepositoryReference] = field(default_factory=list)
    objectives: list[str] = field(default_factory=list)
    keywords: list[str] = field(default_factory=list)
    maturity_stage: ResearchMaturityStage = ResearchMaturityStage.EXPLORATORY
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    status: str = "created"
    execution_config: ExecutionConfig = field(default_factory=ExecutionConfig)
    compiled_knowledge: Optional[dict] = None
    quality_metrics: QualityMetrics = field(default_factory=QualityMetrics)
    
    def artifact_count(self) -> int:
        """Get total count of artifacts in this project."""
        return len(self.papers) + len(self.talks) + len(self.repositories)
    
    def add_paper(self, paper: PaperReference) -> None:
        """Add a paper reference to the project."""
        if any(p.id == paper.id for p in self.papers):
            raise ValueError(f"Paper with id {paper.id} already exists")
        self.papers.append(paper)
        self.updated_at = datetime.now()
    
    def add_talk(self, talk: TalkReference) -> None:
        """Add a talk reference to the project."""
        if any(t.id == talk.id for t in self.talks):
            raise ValueError(f"Talk with id {talk.id} already exists")
        self.talks.append(talk)
        self.updated_at = datetime.now()
    
    def add_repository(self, repo: RepositoryReference) -> None:
        """Add a repository reference to the project."""
        if any(r.id == repo.id for r in self.repositories):
            raise ValueError(f"Repository with id {repo.id} already exists")
        self.repositories.append(repo)
        self.updated_at = datetime.now()
    
    def remove_paper(self, paper_id: str) -> None:
        """Remove a paper reference by id."""
        self.papers = [p for p in self.papers if p.id != paper_id]
        self.updated_at = datetime.now()
    
    def remove_talk(self, talk_id: str) -> None:
        """Remove a talk reference by id."""
        self.talks = [t for t in self.talks if t.id != talk_id]
        self.updated_at = datetime.now()
    
    def remove_repository(self, repo_id: str) -> None:
        """Remove a repository reference by id."""
        self.repositories = [r for r in self.repositories if r.id != repo_id]
        self.updated_at = datetime.now()
    
    def to_dict(self) -> dict:
        """Convert to dictionary for serialization."""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "research_area": self.research_area,
            "papers": [p.to_dict() for p in self.papers],
            "talks": [t.to_dict() for t in self.talks],
            "repositories": [r.to_dict() for r in self.repositories],
            "objectives": self.objectives,
            "keywords": self.keywords,
            "maturity_stage": self.maturity_stage.value,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "status": self.status,
            "execution_config": self.execution_config.to_dict(),
            "compiled_knowledge": self.compiled_knowledge,
            "quality_metrics": self.quality_metrics.to_dict(),
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> "ProjectDefinition":
        """Create from dictionary for deserialization."""
        papers = [PaperReference.from_dict(p) for p in data.get("papers", [])]
        talks = [TalkReference.from_dict(t) for t in data.get("talks", [])]
        repositories = [RepositoryReference.from_dict(r) for r in data.get("repositories", [])]
        
        maturity_stage = ResearchMaturityStage(data.get("maturity_stage", "exploratory"))
        execution_config = ExecutionConfig.from_dict(data.get("execution_config", {}))
        quality_metrics = QualityMetrics.from_dict(data.get("quality_metrics", {}))
        
        created_at = datetime.fromisoformat(data["created_at"]) if "created_at" in data else datetime.now()
        updated_at = datetime.fromisoformat(data["updated_at"]) if "updated_at" in data else datetime.now()
        
        return cls(
            id=data["id"],
            name=data["name"],
            description=data["description"],
            research_area=data["research_area"],
            papers=papers,
            talks=talks,
            repositories=repositories,
            objectives=data.get("objectives", []),
            keywords=data.get("keywords", []),
            maturity_stage=maturity_stage,
            created_at=created_at,
            updated_at=updated_at,
            status=data.get("status", "created"),
            execution_config=execution_config,
            compiled_knowledge=data.get("compiled_knowledge"),
            quality_metrics=quality_metrics,
        )
